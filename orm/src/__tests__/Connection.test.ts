import { Connection, ConnectionConfig } from '../index';
import { testConfig } from './jest.setup';

describe('Connection', () => {
  let connection: Connection;

  beforeAll(async () => {
    connection = Connection.getInstance(testConfig);
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const connection1 = Connection.getInstance();
      const connection2 = Connection.getInstance();
      expect(connection1).toBe(connection2);
    });

    it('should throw error if no config provided on first call', () => {
      // Reset singleton for this test
      (Connection as any).instance = undefined;
      expect(() => Connection.getInstance()).toThrow('Connection config is required for first initialization');
    });
  });

  describe('Basic Query Operations', () => {
    it('should execute a simple query', async () => {
      const result = await connection.query('SELECT 1 as test');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].test).toBe(1);
    });

    it('should execute a query with parameters', async () => {
      const result = await connection.query('SELECT $1 as value', [42]);
      expect(result.rows[0].value).toBe('42');
    });

    it('should handle multiple parameters', async () => {
      const result = await connection.query('SELECT $1 as first, $2 as second', ['hello', 'world']);
      expect(result.rows[0].first).toBe('hello');
      expect(result.rows[0].second).toBe('world');
    });

    it('should get current timestamp', async () => {
      const result = await connection.query('SELECT NOW() as current_time');
      expect(result.rows[0].current_time).toBeInstanceOf(Date);
    });
  });

  describe('Transaction Operations', () => {
    it('should begin, commit transaction', async () => {
      const client = await connection.beginTransaction();
      expect(client).toBeDefined();

      const result = await connection.queryWithClient(client, 'SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);

      await connection.commitTransaction(client);
    });

    it('should begin, rollback transaction', async () => {
      const client = await connection.beginTransaction();
      expect(client).toBeDefined();

      const result = await connection.queryWithClient(client, 'SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);

      await connection.rollbackTransaction(client);
    });

    it('should handle transaction errors', async () => {
      const client = await connection.beginTransaction();
      
      try {
        // This should fail
        await connection.queryWithClient(client, 'SELECT * FROM non_existent_table');
        fail('Should have thrown an error');
      } catch (error) {
        await connection.rollbackTransaction(client);
        expect(error).toBeDefined();
      }
    });
  });

  describe('Connection Pool', () => {
    it('should have a pool', () => {
      const pool = connection.getPool();
      expect(pool).toBeDefined();
    });

    it('should handle multiple concurrent queries', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        connection.query('SELECT $1 as id', [i])
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      
      results.forEach((result, index) => {
        expect(result.rows[0].id).toBe(index.toString());
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid SQL', async () => {
      await expect(connection.query('INVALID SQL')).rejects.toThrow();
    });

    it('should handle connection errors gracefully', async () => {
      const invalidConfig: ConnectionConfig = {
        host: 'invalid-host',
        port: 5432,
        database: 'invalid-db',
        username: 'invalid-user',
        password: 'invalid-password'
      };

      await expect(() => new Connection(invalidConfig)).not.toThrow();
    });
  });
});
