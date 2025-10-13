import { QueryBuilder, Connection } from '../index';
import { testConfig } from './jest.setup';

describe('QueryBuilder', () => {
  let connection: Connection;

  beforeAll(async () => {
    connection = Connection.getInstance(testConfig);
  });

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
  });

  describe('Factory Method', () => {
    it('should create QueryBuilder instance', () => {
      const qb = QueryBuilder.create(connection, 'test_table');
      expect(qb).toBeInstanceOf(QueryBuilder);
    });

    it('should create QueryBuilder without table name', () => {
      const qb = QueryBuilder.create(connection);
      expect(qb).toBeInstanceOf(QueryBuilder);
    });
  });

  describe('SELECT Query Building', () => {
    it('should build basic SELECT query', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .select(['id', 'name', 'email']);

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT id, name, email FROM users');
      expect(params).toEqual([]);
    });

    it('should build SELECT with WHERE condition', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .select()
        .where('active', true);

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT * FROM users WHERE active = $1');
      expect(params).toEqual([true]);
    });

    it('should build SELECT with multiple WHERE conditions', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .select()
        .where('active', true)
        .andWhere('age', '>', 18);

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT * FROM users WHERE active = $1 AND age > $2');
      expect(params).toEqual([true, 18]);
    });

    it('should build SELECT with OR condition', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .select()
        .where('active', true)
        .orWhere('role', 'admin');

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT * FROM users WHERE active = $1 OR role = $2');
      expect(params).toEqual([true, 'admin']);
    });

    it('should build SELECT with ORDER BY', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .select()
        .orderBy('name', 'ASC');

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT * FROM users ORDER BY name ASC');
      expect(params).toEqual([]);
    });

    it('should build SELECT with LIMIT and OFFSET', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .select()
        .limit(10)
        .offset(20);

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT * FROM users LIMIT 10 OFFSET 20');
      expect(params).toEqual([]);
    });

    it('should build SELECT with JOIN', () => {
      const qb = QueryBuilder.create(connection)
        .select(['u.name', 'p.title'])
        .from('users u')
        .leftJoin('posts p', 'u.id = p.user_id');

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT u.name, p.title FROM users u LEFT JOIN posts p ON u.id = p.user_id');
      expect(params).toEqual([]);
    });

    it('should build SELECT with GROUP BY and HAVING', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .select(['role', 'COUNT(*) as count'])
        .groupBy('role')
        .having({ field: 'count', operator: '>', value: 5 });

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT role, COUNT(*) as count FROM users GROUP BY role HAVING count > $1');
      expect(params).toEqual([5]);
    });

    it('should build complex SELECT query', () => {
      const qb = QueryBuilder.create(connection)
        .select(['u.name', 'COUNT(p.id) as post_count'])
        .from('users u')
        .leftJoin('posts p', 'u.id = p.user_id')
        .where('u.active', true)
        .groupBy('u.id', 'u.name')
        .having({ field: 'post_count', operator: '>', value: 0 })
        .orderBy('post_count', 'DESC')
        .limit(10);

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT u.name, COUNT(p.id) as post_count FROM users u LEFT JOIN posts p ON u.id = p.user_id WHERE u.active = $1 GROUP BY u.id, u.name HAVING post_count > $2 ORDER BY post_count DESC LIMIT 10');
      expect(params).toEqual([true, 0]);
    });
  });

  describe('INSERT Query Building', () => {
    it('should build INSERT query', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .insert({
          name: 'John Doe',
          email: 'john@example.com',
          active: true
        });

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('INSERT INTO users (name, email, active) VALUES ($1, $2, $3)');
      expect(params).toEqual(['John Doe', 'john@example.com', true]);
    });
  });

  describe('UPDATE Query Building', () => {
    it('should build UPDATE query', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .update({ active: false })
        .where('id', 1);

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('UPDATE users SET active = $1 WHERE id = $2');
      expect(params).toEqual([false, 1]);
    });

    it('should build UPDATE query without WHERE', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .update({ active: false });

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('UPDATE users SET active = $1');
      expect(params).toEqual([false]);
    });
  });

  describe('DELETE Query Building', () => {
    it('should build DELETE query', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .delete()
        .where('id', 1);

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('DELETE FROM users WHERE id = $1');
      expect(params).toEqual([1]);
    });

    it('should build DELETE query without WHERE', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .delete();

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('DELETE FROM users');
      expect(params).toEqual([]);
    });
  });

  describe('Condition Building', () => {
    it('should handle IS NULL condition', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .where({ field: 'deleted_at', operator: 'IS NULL' });

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT * FROM users WHERE deleted_at IS NULL');
      expect(params).toEqual([]);
    });

    it('should handle IS NOT NULL condition', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .where({ field: 'email', operator: 'IS NOT NULL' });

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT * FROM users WHERE email IS NOT NULL');
      expect(params).toEqual([]);
    });

    it('should handle IN condition', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .where({ field: 'id', operator: 'IN', value: [1, 2, 3] });

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT * FROM users WHERE id IN ($1, $2, $3)');
      expect(params).toEqual([1, 2, 3]);
    });

    it('should handle NOT IN condition', () => {
      const qb = QueryBuilder.create(connection, 'users')
        .where({ field: 'status', operator: 'NOT IN', value: ['banned', 'deleted'] });

      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT * FROM users WHERE status NOT IN ($1, $2)');
      expect(params).toEqual(['banned', 'deleted']);
    });
  });

  describe('Raw SQL Support', () => {
    it('should create raw query', () => {
      const qb = QueryBuilder.raw(connection, 'SELECT COUNT(*) FROM users WHERE active = $1', [true]);
      const { sql, params } = qb.buildQuery();
      expect(sql).toBe('SELECT COUNT(*) FROM users WHERE active = $1');
      expect(params).toEqual([true]);
    });
  });

  describe('Execution Methods', () => {
    it('should execute query and return result', async () => {
      const qb = QueryBuilder.create(connection)
        .select(['1 as test']);

      const result = await qb.execute();
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].test).toBe(1);
    });

    it('should get one result', async () => {
      const qb = QueryBuilder.create(connection)
        .select(['1 as test']);

      const result = await qb.getOne();
      expect(result).toEqual({ test: 1 });
    });

    it('should get many results', async () => {
      const qb = QueryBuilder.create(connection)
        .select(['1 as test']);

      const result = await qb.getMany();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ test: 1 });
    });

    it('should count results', async () => {
      const qb = QueryBuilder.create(connection)
        .select(['1 as test']);

      const count = await qb.count();
      expect(count).toBe(1);
    });
  });

  describe('Legacy Methods', () => {
    it('should support legacy find method', async () => {
      const qb = QueryBuilder.create(connection, 'users');
      // Test that the method exists and can be called
      expect(typeof qb.find).toBe('function');
      // Don't actually execute since the table doesn't exist
      await expect(qb.find('1')).rejects.toThrow();
    });
  });
});
