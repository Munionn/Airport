import { Model } from '../core/Model';
import { Connection } from '../core/Connection';
import { MetadataStorage } from '../core/MetadataStorage';
import { ModelMetadata, ColumnMetadata, RelationshipMetadata } from '../types';
import { testConfig } from './jest.setup';

describe('Model', () => {
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

  describe('Connection Management', () => {
    it('should set and get connection', () => {
      class TestModel extends Model {}
      
      TestModel.setConnection(connection);
      expect(TestModel.getConnection()).toBe(connection);
    });
  });

  describe('Metadata Access', () => {
    class TestModel extends Model {
      id!: number;
      name!: string;
      email!: string;
    }

    beforeEach(() => {
      const metadata: ModelMetadata = {
        tableName: 'test_models',
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
          }]
        ]),
        relationships: new Map(),
        primaryKey: 'id'
      };

      metadataStorage.setMetadata(TestModel, metadata);
    });

    it('should get metadata', () => {
      const metadata = TestModel.getMetadata();
      expect(metadata).toBeDefined();
      expect(metadata?.tableName).toBe('test_models');
    });

    it('should get table name', () => {
      const tableName = TestModel.getTableName();
      expect(tableName).toBe('test_models');
    });

    it('should get primary key', () => {
      const primaryKey = TestModel.getPrimaryKey();
      expect(primaryKey).toBe('id');
    });

    it('should get column metadata', () => {
      const columnMeta = TestModel.getColumnMetadata('name');
      expect(columnMeta).toBeDefined();
      expect(columnMeta?.name).toBe('name');
      expect(columnMeta?.type).toBe('VARCHAR');
    });

    it('should get all columns', () => {
      const columns = TestModel.getAllColumns();
      expect(columns.size).toBe(3);
      expect(columns.has('id')).toBe(true);
      expect(columns.has('name')).toBe(true);
      expect(columns.has('email')).toBe(true);
    });

    it('should get relationship metadata', () => {
      const relationshipMeta = TestModel.getRelationshipMetadata('nonExistent');
      expect(relationshipMeta).toBeUndefined();
    });

    it('should get all relationships', () => {
      const relationships = TestModel.getAllRelationships();
      expect(relationships.size).toBe(0);
    });
  });

  describe('Model without Metadata', () => {
    class ModelWithoutMetadata extends Model {}

    it('should return undefined for metadata when not set', () => {
      const metadata = ModelWithoutMetadata.getMetadata();
      expect(metadata).toBeUndefined();
    });

    it('should return undefined for table name when not set', () => {
      const tableName = ModelWithoutMetadata.getTableName();
      expect(tableName).toBeUndefined();
    });

    it('should return undefined for primary key when not set', () => {
      const primaryKey = ModelWithoutMetadata.getPrimaryKey();
      expect(primaryKey).toBeUndefined();
    });

    it('should return undefined for column metadata when not set', () => {
      const columnMeta = ModelWithoutMetadata.getColumnMetadata('id');
      expect(columnMeta).toBeUndefined();
    });

    it('should return empty map for columns when not set', () => {
      const columns = ModelWithoutMetadata.getAllColumns();
      expect(columns.size).toBe(0);
    });

    it('should return undefined for relationship metadata when not set', () => {
      const relationshipMeta = ModelWithoutMetadata.getRelationshipMetadata('posts');
      expect(relationshipMeta).toBeUndefined();
    });

    it('should return empty map for relationships when not set', () => {
      const relationships = ModelWithoutMetadata.getAllRelationships();
      expect(relationships.size).toBe(0);
    });
  });

  describe('Model with Relationships', () => {
    class Post {
      id!: number;
      title!: string;
    }

    class User extends Model {
      id!: number;
      name!: string;
      posts!: Post[];
    }

    beforeEach(() => {
      const metadata: ModelMetadata = {
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
          }]
        ]),
        relationships: new Map([
          ['posts', {
            type: 'OneToMany',
            target: () => Post,
            propertyName: 'posts',
            options: {
              target: () => Post,
              lazy: true
            }
          }]
        ]),
        primaryKey: 'id'
      };

      metadataStorage.setMetadata(User, metadata);
    });

    it('should get relationship metadata', () => {
      const relationshipMeta = User.getRelationshipMetadata('posts');
      expect(relationshipMeta).toBeDefined();
      expect(relationshipMeta?.type).toBe('OneToMany');
      expect(relationshipMeta?.propertyName).toBe('posts');
    });

    it('should get all relationships', () => {
      const relationships = User.getAllRelationships();
      expect(relationships.size).toBe(1);
      expect(relationships.has('posts')).toBe(true);
    });
  });

  describe('Static Method Inheritance', () => {
    class BaseModel extends Model {
      id!: number;
    }

    class ExtendedModel extends BaseModel {
      name!: string;
    }

    beforeEach(() => {
      const baseMetadata: ModelMetadata = {
        tableName: 'base_models',
        columns: new Map([
          ['id', {
            name: 'id',
            propertyName: 'id',
            type: 'SERIAL',
            options: { type: 'SERIAL' }
          }]
        ]),
        relationships: new Map(),
        primaryKey: 'id'
      };

      const extendedMetadata: ModelMetadata = {
        tableName: 'extended_models',
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
          }]
        ]),
        relationships: new Map(),
        primaryKey: 'id'
      };

      metadataStorage.setMetadata(BaseModel, baseMetadata);
      metadataStorage.setMetadata(ExtendedModel, extendedMetadata);
    });

    it('should have separate metadata for each class', () => {
      const baseTableName = BaseModel.getTableName();
      const extendedTableName = ExtendedModel.getTableName();

      expect(baseTableName).toBe('base_models');
      expect(extendedTableName).toBe('extended_models');
    });

    it('should have separate column metadata', () => {
      const baseColumns = BaseModel.getAllColumns();
      const extendedColumns = ExtendedModel.getAllColumns();

      expect(baseColumns.size).toBe(1);
      expect(extendedColumns.size).toBe(2);
      expect(baseColumns.has('id')).toBe(true);
      expect(extendedColumns.has('id')).toBe(true);
      expect(extendedColumns.has('name')).toBe(true);
    });
  });

  describe('CRUD Operations', () => {
    class TestModel extends Model {
      id!: number;
      name!: string;
      email!: string;
    }

    beforeEach(() => {
      const metadata: ModelMetadata = {
        tableName: 'test_models',
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
          }]
        ]),
        relationships: new Map(),
        primaryKey: 'id'
      };

      metadataStorage.setMetadata(TestModel, metadata);
      TestModel.setConnection(connection);
    });

    describe('find method', () => {
      it('should throw error when no metadata is found', async () => {
        class ModelWithoutMetadata extends Model {}
        
        await expect(ModelWithoutMetadata.find(1)).rejects.toThrow('No metadata found for model ModelWithoutMetadata');
      });

      it('should throw error when no primary key is defined', async () => {
        class ModelWithoutPK extends Model {}
        
        const metadata: ModelMetadata = {
          tableName: 'test_table',
          columns: new Map(),
          relationships: new Map()
          // No primaryKey defined
        };
        
        metadataStorage.setMetadata(ModelWithoutPK, metadata);
        ModelWithoutPK.setConnection(connection);
        
        await expect(ModelWithoutPK.find(1)).rejects.toThrow('No primary key defined for model ModelWithoutPK');
      });

      it('should throw error when no table name is defined', async () => {
        class ModelWithoutTable extends Model {}
        
        const metadata: ModelMetadata = {
          tableName: '', // Empty table name
          columns: new Map([
            ['id', {
              name: 'id',
              propertyName: 'id',
              type: 'SERIAL',
              options: { type: 'SERIAL' }
            }]
          ]),
          relationships: new Map(),
          primaryKey: 'id'
        };
        
        metadataStorage.setMetadata(ModelWithoutTable, metadata);
        ModelWithoutTable.setConnection(connection);
        
        await expect(ModelWithoutTable.find(1)).rejects.toThrow('No table name defined for model ModelWithoutTable');
      });

      it('should throw error when no connection is set', async () => {
        class ModelWithoutConnection extends Model {}
        
        const metadata: ModelMetadata = {
          tableName: 'test_table',
          columns: new Map([
            ['id', {
              name: 'id',
              propertyName: 'id',
              type: 'SERIAL',
              options: { type: 'SERIAL' }
            }]
          ]),
          relationships: new Map(),
          primaryKey: 'id'
        };
        
        metadataStorage.setMetadata(ModelWithoutConnection, metadata);
        // No connection set
        
        await expect(ModelWithoutConnection.find(1)).rejects.toThrow('No connection set for model ModelWithoutConnection');
      });

      it('should return null when record is not found', async () => {
        // Mock the connection query to return empty result
        const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
        const mockConnection = { query: mockQuery } as any;
        TestModel.setConnection(mockConnection);

        const result = await TestModel.find(999);
        expect(result).toBeNull();
        expect(mockQuery).toHaveBeenCalledWith(
          'SELECT * FROM test_models WHERE id = $1 LIMIT 1',
          [999]
        );
      });

      it('should return model instance when record is found', async () => {
        const mockData = { id: 1, name: 'Test User', email: 'test@example.com' };
        const mockQuery = jest.fn().mockResolvedValue({ rows: [mockData] });
        const mockConnection = { query: mockQuery } as any;
        TestModel.setConnection(mockConnection);

        const result = await TestModel.find(1);
        
        expect(result).toBeInstanceOf(TestModel);
        expect(result).toEqual(expect.objectContaining(mockData));
        expect(mockQuery).toHaveBeenCalledWith(
          'SELECT * FROM test_models WHERE id = $1 LIMIT 1',
          [1]
        );
      });
    });

    describe('query method', () => {
      it('should throw error when no table name is defined', () => {
        class ModelWithoutTable extends Model {}
        
        const metadata: ModelMetadata = {
          tableName: '', // Empty table name
          columns: new Map(),
          relationships: new Map()
        };
        
        metadataStorage.setMetadata(ModelWithoutTable, metadata);
        
        expect(() => ModelWithoutTable.query()).toThrow('No table name defined for model ModelWithoutTable');
      });

      it('should throw error when no connection is set', () => {
        class ModelWithoutConnection extends Model {}
        
        const metadata: ModelMetadata = {
          tableName: 'test_table',
          columns: new Map(),
          relationships: new Map()
        };
        
        metadataStorage.setMetadata(ModelWithoutConnection, metadata);
        // No connection set
        
        expect(() => ModelWithoutConnection.query()).toThrow('No connection set for model ModelWithoutConnection');
      });

      it('should return QueryBuilder instance', () => {
        const queryBuilder = TestModel.query();
        expect(queryBuilder).toBeDefined();
        expect(queryBuilder.constructor.name).toBe('QueryBuilder');
      });
    });
  });
});
