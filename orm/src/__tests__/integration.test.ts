import { Connection, QueryBuilder, Model, MetadataStorage } from '../index';
import { testConfig } from './jest.setup';

describe('ORM Integration Tests', () => {
  let connection: Connection;
  let metadataStorage: MetadataStorage;

  beforeAll(async () => {
    connection = Connection.getInstance(testConfig);
    metadataStorage = MetadataStorage.getInstance();
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
  });

  beforeEach(() => {
    metadataStorage.clear();
  });

  describe('Model with QueryBuilder Integration', () => {
    class User extends Model {
      id!: number;
      name!: string;
      email!: string;
      active!: boolean;
    }

    beforeEach(() => {
      const metadata = {
        tableName: 'users',
        columns: new Map([
          ['id', {
            name: 'id',
            propertyName: 'id',
            type: 'SERIAL',
            options: { type: 'SERIAL' }
          }],
          ['name', {
            name: 'name',
            propertyName: 'name',
            type: 'VARCHAR',
            options: { type: 'VARCHAR', length: 255 }
          }],
          ['email', {
            name: 'email',
            propertyName: 'email',
            type: 'VARCHAR',
            options: { type: 'VARCHAR', length: 255 }
          }],
          ['active', {
            name: 'active',
            propertyName: 'active',
            type: 'BOOLEAN',
            options: { type: 'BOOLEAN' }
          }]
        ]),
        relationships: new Map(),
        primaryKey: 'id'
      };

      metadataStorage.setMetadata(User, metadata);
      User.setConnection(connection);
    });

    it('should work with QueryBuilder using model metadata', () => {
      const tableName = User.getTableName();
      expect(tableName).toBe('users');

      const qb = QueryBuilder.create(connection, tableName)
        .select(['id', 'name', 'email'])
        .where('active', true);

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT id, name, email FROM users WHERE active = $1');
      expect(params).toEqual([true]);
    });

    it('should build complex queries using model metadata', () => {
      const tableName = User.getTableName();
      const primaryKey = User.getPrimaryKey();
      const columns = User.getAllColumns();

      expect(tableName).toBe('users');
      expect(primaryKey).toBe('id');
      expect(columns.size).toBe(4);

      const qb = QueryBuilder.create(connection, tableName)
        .select(['id', 'name', 'email'])
        .where('active', true)
        .orderBy('name', 'ASC')
        .limit(10);

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT id, name, email FROM users WHERE active = $1 ORDER BY name ASC LIMIT 10');
      expect(params).toEqual([true]);
    });
  });

  describe('Connection Pool with Multiple Models', () => {
    class User extends Model {
      id!: number;
      name!: string;
    }

    class Post extends Model {
      id!: number;
      title!: string;
      userId!: number;
    }

    beforeEach(() => {
      const userMetadata = {
        tableName: 'users',
        columns: new Map([
          ['id', { name: 'id', propertyName: 'id', type: 'SERIAL', options: { type: 'SERIAL' } }],
          ['name', { name: 'name', propertyName: 'name', type: 'VARCHAR', options: { type: 'VARCHAR', length: 255 } }]
        ]),
        relationships: new Map(),
        primaryKey: 'id'
      };

      const postMetadata = {
        tableName: 'posts',
        columns: new Map([
          ['id', { name: 'id', propertyName: 'id', type: 'SERIAL', options: { type: 'SERIAL' } }],
          ['title', { name: 'title', propertyName: 'title', type: 'VARCHAR', options: { type: 'VARCHAR', length: 255 } }],
          ['userId', { name: 'user_id', propertyName: 'userId', type: 'INTEGER', options: { type: 'INTEGER' } }]
        ]),
        relationships: new Map(),
        primaryKey: 'id'
      };

      metadataStorage.setMetadata(User, userMetadata);
      metadataStorage.setMetadata(Post, postMetadata);
      
      User.setConnection(connection);
      Post.setConnection(connection);
    });

    it('should handle multiple models with same connection', async () => {
      const userQb = QueryBuilder.create(connection)
        .select(['1 as test']);

      const postQb = QueryBuilder.create(connection)
        .select(['2 as test']);

      const userResult = await userQb.execute();
      const postResult = await postQb.execute();

      expect(userResult).toBeDefined();
      expect(postResult).toBeDefined();
    });

    it('should build JOIN queries between related models', () => {
      const qb = QueryBuilder.create(connection)
        .select(['u.name', 'p.title'])
        .from(`${User.getTableName()} u`)
        .leftJoin(`${Post.getTableName()} p`, 'u.id = p.user_id')
        .where('u.id', 1);

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT u.name, p.title FROM users u LEFT JOIN posts p ON u.id = p.user_id WHERE u.id = $1');
      expect(params).toEqual([1]);
    });
  });

  describe('Transaction Integration', () => {
    class TestModel extends Model {
      id!: number;
      value!: string;
    }

    beforeEach(() => {
      const metadata = {
        tableName: 'test_models',
        columns: new Map([
          ['id', { name: 'id', propertyName: 'id', type: 'SERIAL', options: { type: 'SERIAL' } }],
          ['value', { name: 'value', propertyName: 'value', type: 'VARCHAR', options: { type: 'VARCHAR', length: 255 } }]
        ]),
        relationships: new Map(),
        primaryKey: 'id'
      };

      metadataStorage.setMetadata(TestModel, metadata);
      TestModel.setConnection(connection);
    });

    it('should work with transactions', async () => {
      const client = await connection.beginTransaction();
      
      try {
        const qb = QueryBuilder.create(connection)
          .select(['1 as test']);
        
        const result = await qb.execute();
        expect(result.rows[0].test).toBe(1);
        
        await connection.commitTransaction(client);
      } catch (error) {
        await connection.rollbackTransaction(client);
        throw error;
      }
    });
  });

  describe('Error Handling Integration', () => {
    class ErrorModel extends Model {
      id!: number;
    }

    beforeEach(() => {
      const metadata = {
        tableName: 'error_models',
        columns: new Map([
          ['id', { name: 'id', propertyName: 'id', type: 'SERIAL', options: { type: 'SERIAL' } }]
        ]),
        relationships: new Map(),
        primaryKey: 'id'
      };

      metadataStorage.setMetadata(ErrorModel, metadata);
      ErrorModel.setConnection(connection);
    });

    it('should handle query errors gracefully', async () => {
      const qb = QueryBuilder.create(connection, 'non_existent_table')
        .select(['*']);

      await expect(qb.execute()).rejects.toThrow();
    });

    it('should handle invalid WHERE conditions', async () => {
      const qb = QueryBuilder.create(connection, 'non_existent_table')
        .select(['*'])
        .where('invalid_column', 'value');

      // This should not throw during query building
      const { sql, params } = qb.buildQuery();
      expect(sql).toContain('WHERE invalid_column = $1');
      expect(params).toEqual(['value']);
    });
  });

  describe('Performance Integration', () => {
    class PerformanceModel extends Model {
      id!: number;
      data!: string;
    }

    beforeEach(() => {
      const metadata = {
        tableName: 'performance_models',
        columns: new Map([
          ['id', { name: 'id', propertyName: 'id', type: 'SERIAL', options: { type: 'SERIAL' } }],
          ['data', { name: 'data', propertyName: 'data', type: 'TEXT', options: { type: 'TEXT' } }]
        ]),
        relationships: new Map(),
        primaryKey: 'id'
      };

      metadataStorage.setMetadata(PerformanceModel, metadata);
      PerformanceModel.setConnection(connection);
    });

    it('should handle multiple concurrent queries', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const qb = QueryBuilder.create(connection)
          .select([`${i} as test`]);
        return qb.execute();
      });

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      
      results.forEach((result, index) => {
        expect(result.rows[0].test).toBe(index);
      });
    });
  });
});
