import { Connection } from "./Connection";
import { QueryCondition, JoinOptions, OrderByOptions } from "../types";

export class QueryBuilder<T = any> {
  private connection: Connection;
  private queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' = 'SELECT';
  private tableName: string = '';
  private columns: string[] = [];
  private whereConditions: QueryCondition[] = [];
  private joins: JoinOptions[] = [];
  private orderByFields: OrderByOptions[] = [];
  private groupByFields: string[] = [];
  private havingConditions: QueryCondition[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private insertData: Record<string, any> = {};
  private updateData: Record<string, any> = {};
  private params: any[] = [];
  private paramCounter = 1;

  constructor(connection: Connection, tableName?: string) {
    this.connection = connection;
    if (tableName) {
      this.tableName = tableName;
    }
  }

  // Static factory method
  static create<T>(connection: Connection, tableName?: string): QueryBuilder<T> {
    return new QueryBuilder<T>(connection, tableName);
  }

  // SELECT operations
  select(columns: string | string[] = '*'): QueryBuilder<T> {
    this.queryType = 'SELECT';
    this.columns = Array.isArray(columns) ? columns : [columns];
    return this;
  }

  from(tableName: string): QueryBuilder<T> {
    this.tableName = tableName;
    return this;
  }

  // WHERE conditions
  where(condition: string | QueryCondition, value?: any): QueryBuilder<T> {
    if (typeof condition === 'string') {
      this.whereConditions.push({
        field: condition,
        operator: '=',
        value: value
      });
    } else {
      this.whereConditions.push(condition);
    }
    return this;
  }

  andWhere(condition: string | QueryCondition, operator?: string, value?: any): QueryBuilder<T> {
    if (typeof condition === 'string' && operator && value !== undefined) {
      this.whereConditions.push({
        field: condition,
        operator: operator as any,
        value: value
      });
    } else if (typeof condition === 'string' && value !== undefined) {
      this.whereConditions.push({
        field: condition,
        operator: '=',
        value: value
      });
    } else if (typeof condition === 'object') {
      this.whereConditions.push(condition);
    }
    return this;
  }

  orWhere(condition: string | QueryCondition, value?: any): QueryBuilder<T> {
    if (typeof condition === 'string') {
      this.whereConditions.push({
        field: condition,
        operator: '=',
        value: value,
        // Add a flag to indicate OR condition
        or: true
      } as any);
    } else {
      this.whereConditions.push({
        ...condition,
        or: true
      } as any);
    }
    return this;
  }

  // JOIN operations
  join(table: string, condition: string, alias?: string): QueryBuilder<T> {
    this.joins.push({
      table,
      alias,
      condition,
      type: 'INNER'
    });
    return this;
  }

  leftJoin(table: string, condition: string, alias?: string): QueryBuilder<T> {
    this.joins.push({
      table,
      alias,
      condition,
      type: 'LEFT'
    });
    return this;
  }

  rightJoin(table: string, condition: string, alias?: string): QueryBuilder<T> {
    this.joins.push({
      table,
      alias,
      condition,
      type: 'RIGHT'
    });
    return this;
  }

  fullJoin(table: string, condition: string, alias?: string): QueryBuilder<T> {
    this.joins.push({
      table,
      alias,
      condition,
      type: 'FULL'
    });
    return this;
  }

  // ORDER BY
  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder<T> {
    this.orderByFields.push({ field, direction });
    return this;
  }

  // GROUP BY
  groupBy(...fields: string[]): QueryBuilder<T> {
    this.groupByFields = fields;
    return this;
  }

  // HAVING
  having(condition: QueryCondition): QueryBuilder<T> {
    this.havingConditions.push(condition);
    return this;
  }

  // LIMIT and OFFSET
  limit(count: number): QueryBuilder<T> {
    this.limitValue = count;
    return this;
  }

  offset(count: number): QueryBuilder<T> {
    this.offsetValue = count;
    return this;
  }

  // INSERT operations
  insert(data: Record<string, any>): QueryBuilder<T> {
    this.queryType = 'INSERT';
    this.insertData = data;
    return this;
  }

  // UPDATE operations
  update(data: Record<string, any>): QueryBuilder<T> {
    this.queryType = 'UPDATE';
    this.updateData = data;
    return this;
  }

  // DELETE operations
  delete(): QueryBuilder<T> {
    this.queryType = 'DELETE';
    return this;
  }

  // Build the SQL query
  buildQuery(): { sql: string; params: any[] } {
    this.params = [];
    this.paramCounter = 1;

    switch (this.queryType) {
      case 'SELECT':
        return this.buildSelectQuery();
      case 'INSERT':
        return this.buildInsertQuery();
      case 'UPDATE':
        return this.buildUpdateQuery();
      case 'DELETE':
        return this.buildDeleteQuery();
      default:
        throw new Error(`Unsupported query type: ${this.queryType}`);
    }
  }

  private buildSelectQuery(): { sql: string; params: any[] } {
    let sql = 'SELECT ';
    
    // Columns
    sql += this.columns.length > 0 ? this.columns.join(', ') : '*';
    
    // FROM
    if (this.tableName) {
      sql += ` FROM ${this.tableName}`;
    }

    // JOINs
    for (const join of this.joins) {
      sql += ` ${join.type} JOIN ${join.table}`;
      if (join.alias) {
        sql += ` AS ${join.alias}`;
      }
      sql += ` ON ${join.condition}`;
    }

    // WHERE
    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.buildWhereClause();
    }

    // GROUP BY
    if (this.groupByFields.length > 0) {
      sql += ' GROUP BY ' + this.groupByFields.join(', ');
    }

    // HAVING
    if (this.havingConditions.length > 0) {
      sql += ' HAVING ' + this.buildHavingClause();
    }

    // ORDER BY
    if (this.orderByFields.length > 0) {
      sql += ' ORDER BY ' + this.orderByFields.map(o => `${o.field} ${o.direction}`).join(', ');
    }

    // LIMIT
    if (this.limitValue !== undefined) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    // OFFSET
    if (this.offsetValue !== undefined) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return { sql, params: this.params };
  }

  private buildInsertQuery(): { sql: string; params: any[] } {
    const columns = Object.keys(this.insertData);
    const values = columns.map(col => this.addParam(this.insertData[col]));
    
    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
    return { sql, params: this.params };
  }

  private buildUpdateQuery(): { sql: string; params: any[] } {
    const setClause = Object.keys(this.updateData)
      .map(col => `${col} = ${this.addParam(this.updateData[col])}`)
      .join(', ');
    
    let sql = `UPDATE ${this.tableName} SET ${setClause}`;
    
    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.buildWhereClause();
    }
    
    return { sql, params: this.params };
  }

  private buildDeleteQuery(): { sql: string; params: any[] } {
    let sql = `DELETE FROM ${this.tableName}`;
    
    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.buildWhereClause();
    }
    
    return { sql, params: this.params };
  }

  private buildWhereClause(): string {
    const conditions: string[] = [];
    let isFirst = true;

    for (const condition of this.whereConditions) {
      const conditionStr = this.buildCondition(condition);
      
      if (isFirst) {
        conditions.push(conditionStr);
        isFirst = false;
      } else {
        const operator = (condition as any).or ? 'OR' : 'AND';
        conditions.push(`${operator} ${conditionStr}`);
      }
    }

    return conditions.join(' ');
  }

  private buildHavingClause(): string {
    return this.havingConditions.map(condition => this.buildCondition(condition)).join(' AND ');
  }

  private buildCondition(condition: QueryCondition): string {
    const { field, operator, value } = condition;
    
    switch (operator) {
      case 'IS NULL':
        return `${field} IS NULL`;
      case 'IS NOT NULL':
        return `${field} IS NOT NULL`;
      case 'IN':
      case 'NOT IN':
        if (Array.isArray(value)) {
          const params = value.map(v => this.addParam(v));
          return `${field} ${operator} (${params.join(', ')})`;
        }
        return `${field} ${operator} (${this.addParam(value)})`;
      default:
        return `${field} ${operator} ${this.addParam(value)}`;
    }
  }

  private addParam(value: any): string {
    this.params.push(value);
    return `$${this.paramCounter++}`;
  }

  // Execute the query
  async execute(): Promise<any> {
    const { sql, params } = this.buildQuery();
    const result = await this.connection.query(sql, params);
    return result;
  }

  // Convenience methods for common operations
  async getOne(): Promise<T | null> {
    this.limit(1);
    const result = await this.execute();
    return result.rows[0] || null;
  }

  async getMany(): Promise<T[]> {
    const result = await this.execute();
    return result.rows;
  }

  async count(): Promise<number> {
    const originalColumns = this.columns;
    this.columns = ['COUNT(*) as count'];
    const result = await this.execute();
    this.columns = originalColumns;
    return parseInt(result.rows[0].count);
  }

  // Raw SQL support
  static raw(connection: Connection, sql: string, params: any[] = []): QueryBuilder {
    const qb = new QueryBuilder(connection);
    qb.params = params;
    qb.buildQuery = () => ({ sql, params });
    return qb;
  }

  // Legacy method for backward compatibility
  async find(id: string): Promise<T | null> {
    return await this.where('id', id).getOne();
  }
}