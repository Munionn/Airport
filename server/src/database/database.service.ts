import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'airport_management_system',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });
  }

  async onModuleInit() {
    try {
      // Test the connection
      const client = await this.pool.connect();
      console.log('✅ Database connected successfully');
      client.release();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    console.log('🔌 Database connection pool closed');
  }

  /**
   * Execute a query and return the result
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a query within a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async bulkTransaction<T extends QueryResultRow = any>(
    queries: Array<{ text: string; params?: unknown[] }>,
  ): Promise<QueryResult<T>[]> {
    return await this.transaction(async client => {
      const results: QueryResult<T>[] = [];
      for (const query of queries) {
        const result = await client.query<T>(query.text, query.params);
        results.push(result);
      }
      return results;
    });
  }

  /**
   * Execute a query with retry logic
   */
  async queryWithRetry<T extends QueryResultRow = any>(
    text: string,
    params?: unknown[],
    maxRetries: number = 3,
  ): Promise<QueryResult<T>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.query<T>(text, params);
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxRetries) {
          throw lastError;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError!;
  }

  /**
   * Execute a stored procedure
   */
  async callProcedure<T extends QueryResultRow = any>(
    procedureName: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    const paramPlaceholders = params ? params.map((_, index) => `$${index + 1}`).join(', ') : '';
    const query = `SELECT * FROM ${procedureName}(${paramPlaceholders})`;
    return await this.query<T>(query, params);
  }

  /**
   * Check if a record exists
   */
  async exists(table: string, conditions: Record<string, unknown>): Promise<boolean> {
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');

    const query = `SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`;
    const result = await this.query(query, Object.values(conditions));

    return result.rows.length > 0;
  }

  /**
   * Count records with conditions
   */
  async count(table: string, conditions?: Record<string, unknown>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    let params: unknown[] = [];

    if (conditions && Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params = Object.values(conditions);
    }

    const result = await this.query<{ count: string }>(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get a client from the pool for manual connection management
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Get the pool instance for advanced usage
   */
  getPool(): Pool {
    return this.pool;
  }

  /**
   * Execute a query with pagination
   */
  async queryPaginated<T extends QueryResultRow = any>(
    text: string,
    params: unknown[] = [],
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;

    // Remove existing LIMIT/OFFSET clauses to avoid conflicts
    const cleanQuery = text.replace(/\s+(LIMIT|OFFSET)\s+\d+(\s+OFFSET\s+\d+)?/gi, '').trim();

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM (${cleanQuery}) as subquery`;
    const countResult = await this.query<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data
    const paginatedQuery = `${cleanQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const dataResult = await this.query<T>(paginatedQuery, [...params, limit, offset]);

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
    };
  }

  /**
   * Execute a query with search functionality
   */
  async search<T extends QueryResultRow = any>(
    table: string,
    searchFields: string[],
    searchTerm: string,
    additionalConditions?: Record<string, unknown>,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;

    // Build search conditions
    const searchConditions = searchFields
      .map((field, index) => `${field} ILIKE $${index + 1}`)
      .join(' OR ');

    // Build additional conditions
    let additionalWhere = '';
    let paramIndex = searchFields.length + 1;
    const params: unknown[] = searchFields.map(() => searchPattern);

    if (additionalConditions) {
      const additionalClause = Object.keys(additionalConditions)
        .map(key => `${key} = $${paramIndex++}`)
        .join(' AND ');
      additionalWhere = ` AND ${additionalClause}`;
      params.push(...Object.values(additionalConditions));
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM ${table} 
      WHERE (${searchConditions})${additionalWhere}
    `;

    const countResult = await this.query<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataQuery = `
      SELECT * 
      FROM ${table} 
      WHERE (${searchConditions})${additionalWhere}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await this.query<T>(dataQuery, [...params, limit, offset]);

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
    };
  }

  /**
   * Execute a query with advanced filtering
   */
  async queryWithFilters<T extends QueryResultRow = any>(
    baseQuery: string,
    filters: Record<string, any>,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params: unknown[] = [];
    let paramIndex = 1;

    // Build WHERE clause from filters
    const filterConditions = Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
          params.push(...(value as unknown[]));
          return `${key} IN (${placeholders})`;
        } else if (typeof value === 'string' && value.includes('%')) {
          params.push(value);
          return `${key} ILIKE $${paramIndex++}`;
        } else {
          params.push(value);
          return `${key} = $${paramIndex++}`;
        }
      });

    if (filterConditions.length > 0) {
      whereClause = `WHERE ${filterConditions.join(' AND ')}`;
    }

    // Count query
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as subquery ${whereClause}`;
    const countResult = await this.query<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Data query
    const dataQuery = `${baseQuery} ${whereClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataResult = await this.query<T>(dataQuery, [...params, limit, offset]);

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
    };
  }

  /**
   * Execute a bulk insert operation
   */
  async bulkInsert<T extends QueryResultRow = any>(
    table: string,
    columns: string[],
    values: unknown[][],
    returningColumns?: string[],
  ): Promise<QueryResult<T>> {
    if (values.length === 0) {
      return { rows: [], rowCount: 0, fields: [], command: 'INSERT', oid: 0 } as QueryResult<T>;
    }

    const columnList = columns.join(', ');
    const valuePlaceholders = values
      .map((row, rowIndex) => {
        const startParam = rowIndex * columns.length + 1;
        return `(${row.map((_, colIndex) => `$${startParam + colIndex}`).join(', ')})`;
      })
      .join(', ');

    const returningClause = returningColumns ? ` RETURNING ${returningColumns.join(', ')}` : '';
    const query = `INSERT INTO ${table} (${columnList}) VALUES ${valuePlaceholders}${returningClause}`;

    const flatValues = values.flat();
    return await this.query<T>(query, flatValues);
  }

  /**
   * Execute a bulk update operation
   */
  async bulkUpdate<T extends QueryResultRow = any>(
    table: string,
    updates: Array<{ id: number; data: Record<string, unknown> }>,
    idColumn: string = 'id',
  ): Promise<QueryResult<T>> {
    if (updates.length === 0) {
      return { rows: [], rowCount: 0, fields: [], command: 'INSERT', oid: 0 } as QueryResult<T>;
    }

    return await this.transaction(async client => {
      const results: QueryResult<T>[] = [];
      for (const update of updates) {
        const { id, data } = update;
        const fields = Object.keys(data).filter(key => data[key] !== undefined);
        if (fields.length === 0) continue;

        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const values = fields.map(field => data[field]);

        const query = `UPDATE ${table} SET ${setClause} WHERE ${idColumn} = $1 RETURNING *`;
        const result = await client.query<T>(query, [id, ...values]);
        results.push(result);
      }

      return {
        rows: results.flatMap(r => r.rows),
        rowCount: results.reduce((sum, r) => sum + (r.rowCount || 0), 0),
        fields: results[0]?.fields || [],
        command: 'UPDATE',
        oid: 0,
      } as QueryResult<T>;
    });
  }

  /**
   * Execute a bulk delete operation
   */
  async bulkDelete(table: string, ids: number[], idColumn: string = 'id'): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
    const query = `DELETE FROM ${table} WHERE ${idColumn} IN (${placeholders})`;
    const result = await this.query(query, ids);
    return result.rowCount || 0;
  }

  /**
   * Execute a query with caching
   */
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async queryWithCache<T extends QueryResultRow = any>(
    text: string,
    params?: unknown[],
    cacheKey?: string,
    ttl: number = this.CACHE_TTL,
  ): Promise<QueryResult<T>> {
    const key = cacheKey || `${text}:${JSON.stringify(params)}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data as QueryResult<T>;
    }

    const result = await this.query<T>(text, params);
    this.cache.set(key, { data: result, timestamp: Date.now() });

    return result;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    const stats = await this.query(`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity) as total_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction') as waiting_connections
    `);
    return stats.rows[0];
  }

  /**
   * Execute a query with timeout
   */
  async queryWithTimeout<T extends QueryResultRow = any>(
    text: string,
    params?: unknown[],
    timeoutMs: number = 30000,
  ): Promise<QueryResult<T>> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.query<T>(text, params)
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error as Error);
        });
    });
  }
}
