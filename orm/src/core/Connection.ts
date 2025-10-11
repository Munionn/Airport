import { Pool, PoolClient, QueryResult } from 'pg';
import { ConnectionConfig } from '../types';

export class Connection {
  private pool: Pool;
  private static instance: Connection;

  constructor(config: ConnectionConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl || false,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  static getInstance(config?: ConnectionConfig): Connection {
    if (!Connection.instance) {
      if (!config) {
        throw new Error('Connection config is required for first initialization');
      }
      Connection.instance = new Connection(config);
    }
    return Connection.instance;
  }

  async connect(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const client = await this.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async queryWithClient(client: PoolClient, text: string, params?: any[]): Promise<QueryResult> {
    return await client.query(text, params);
  }

  async beginTransaction(): Promise<PoolClient> {
    const client = await this.connect();
    await client.query('BEGIN');
    return client;
  }

  async commitTransaction(client: PoolClient): Promise<void> {
    await client.query('COMMIT');
    client.release();
  }

  async rollbackTransaction(client: PoolClient): Promise<void> {
    await client.query('ROLLBACK');
    client.release();
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  getPool(): Pool {
    return this.pool;
  }
}
