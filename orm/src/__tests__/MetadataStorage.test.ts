import { MetadataStorage, ModelMetadata, ColumnMetadata, RelationshipMetadata } from '../core/MetadataStorage';
import { ColumnOptions, RelationshipOptions } from '../types';

describe('MetadataStorage', () => {
  let metadataStorage: MetadataStorage;

  beforeEach(() => {
    metadataStorage = MetadataStorage.getInstance();
    metadataStorage.clear(); // Clear metadata before each test
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MetadataStorage.getInstance();
      const instance2 = MetadataStorage.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Model Metadata Management', () => {
    class TestModel {
      id!: number;
      name!: string;
    }

    it('should store and retrieve model metadata', () => {
      const metadata: ModelMetadata = {
        tableName: 'test_models',
        columns: new Map(),
        relationships: new Map()
      };

      metadataStorage.setMetadata(TestModel, metadata);
      const retrieved = metadataStorage.getMetadata(TestModel);

      expect(retrieved).toBe(metadata);
      expect(retrieved?.tableName).toBe('test_models');
    });

    it('should return undefined for non-existent metadata', () => {
      class NonExistentModel {}
      const metadata = metadataStorage.getMetadata(NonExistentModel);
      expect(metadata).toBeUndefined();
    });
  });

  describe('Column Metadata Management', () => {
    class TestModel {
      id!: number;
      name!: string;
    }

    beforeEach(() => {
      const metadata: ModelMetadata = {
        tableName: 'test_models',
        columns: new Map(),
        relationships: new Map()
      };
      metadataStorage.setMetadata(TestModel, metadata);
    });

    it('should store and retrieve column metadata', () => {
      const columnMeta: ColumnMetadata = {
        name: 'id',
        propertyName: 'id',
        type: 'SERIAL',
        options: { type: 'SERIAL' }
      };

      const metadata = metadataStorage.getMetadata(TestModel)!;
      metadata.columns.set('id', columnMeta);

      const retrieved = metadataStorage.getColumnMetadata(TestModel, 'id');
      expect(retrieved).toBe(columnMeta);
    });

    it('should return undefined for non-existent column', () => {
      const retrieved = metadataStorage.getColumnMetadata(TestModel, 'nonExistent');
      expect(retrieved).toBeUndefined();
    });

    it('should get all columns', () => {
      const columnMeta1: ColumnMetadata = {
        name: 'id',
        propertyName: 'id',
        type: 'SERIAL',
        options: { type: 'SERIAL' }
      };

      const columnMeta2: ColumnMetadata = {
        name: 'name',
        propertyName: 'name',
        type: 'VARCHAR',
        options: { type: 'VARCHAR', length: 255 }
      };

      const metadata = metadataStorage.getMetadata(TestModel)!;
      metadata.columns.set('id', columnMeta1);
      metadata.columns.set('name', columnMeta2);

      const allColumns = metadataStorage.getAllColumns(TestModel);
      expect(allColumns.size).toBe(2);
      expect(allColumns.get('id')).toBe(columnMeta1);
      expect(allColumns.get('name')).toBe(columnMeta2);
    });
  });

  describe('Relationship Metadata Management', () => {
    class TestModel {
      id!: number;
      posts!: any[];
    }

    beforeEach(() => {
      const metadata: ModelMetadata = {
        tableName: 'test_models',
        columns: new Map(),
        relationships: new Map()
      };
      metadataStorage.setMetadata(TestModel, metadata);
    });

    it('should store and retrieve relationship metadata', () => {
      const relationshipMeta: RelationshipMetadata = {
        type: 'OneToMany',
        target: () => Object,
        propertyName: 'posts',
        options: {
          target: () => Object,
          lazy: true
        }
      };

      const metadata = metadataStorage.getMetadata(TestModel)!;
      metadata.relationships.set('posts', relationshipMeta);

      const retrieved = metadataStorage.getRelationshipMetadata(TestModel, 'posts');
      expect(retrieved).toBe(relationshipMeta);
    });

    it('should return undefined for non-existent relationship', () => {
      const retrieved = metadataStorage.getRelationshipMetadata(TestModel, 'nonExistent');
      expect(retrieved).toBeUndefined();
    });

    it('should get all relationships', () => {
      const relationshipMeta: RelationshipMetadata = {
        type: 'OneToMany',
        target: () => Object,
        propertyName: 'posts',
        options: {
          target: () => Object,
          lazy: true
        }
      };

      const metadata = metadataStorage.getMetadata(TestModel)!;
      metadata.relationships.set('posts', relationshipMeta);

      const allRelationships = metadataStorage.getAllRelationships(TestModel);
      expect(allRelationships.size).toBe(1);
      expect(allRelationships.get('posts')).toBe(relationshipMeta);
    });
  });

  describe('Primary Key Management', () => {
    class TestModel {
      id!: number;
      name!: string;
    }

    beforeEach(() => {
      const metadata: ModelMetadata = {
        tableName: 'test_models',
        columns: new Map(),
        relationships: new Map(),
        primaryKey: 'id'
      };
      metadataStorage.setMetadata(TestModel, metadata);
    });

    it('should get primary key', () => {
      const primaryKey = metadataStorage.getPrimaryKey(TestModel);
      expect(primaryKey).toBe('id');
    });

    it('should return undefined for model without primary key', () => {
      class ModelWithoutPK {}
      const metadata: ModelMetadata = {
        tableName: 'test_models',
        columns: new Map(),
        relationships: new Map()
      };
      metadataStorage.setMetadata(ModelWithoutPK, metadata);

      const primaryKey = metadataStorage.getPrimaryKey(ModelWithoutPK);
      expect(primaryKey).toBeUndefined();
    });
  });

  describe('Table Name Management', () => {
    class TestModel {
      id!: number;
    }

    beforeEach(() => {
      const metadata: ModelMetadata = {
        tableName: 'test_models',
        columns: new Map(),
        relationships: new Map()
      };
      metadataStorage.setMetadata(TestModel, metadata);
    });

    it('should get table name', () => {
      const tableName = metadataStorage.getTableName(TestModel);
      expect(tableName).toBe('test_models');
    });

    it('should return undefined for model without table name', () => {
      class ModelWithoutTable {}
      const metadata: ModelMetadata = {
        tableName: '',
        columns: new Map(),
        relationships: new Map()
      };
      metadataStorage.setMetadata(ModelWithoutTable, metadata);

      const tableName = metadataStorage.getTableName(ModelWithoutTable);
      expect(tableName).toBe('');
    });
  });

  describe('Utility Methods', () => {
    it('should get all metadata', () => {
      class TestModel1 {}
      class TestModel2 {}

      const metadata1: ModelMetadata = {
        tableName: 'test1',
        columns: new Map(),
        relationships: new Map()
      };

      const metadata2: ModelMetadata = {
        tableName: 'test2',
        columns: new Map(),
        relationships: new Map()
      };

      metadataStorage.setMetadata(TestModel1, metadata1);
      metadataStorage.setMetadata(TestModel2, metadata2);

      const allMetadata = metadataStorage.getAllMetadata();
      expect(allMetadata.size).toBe(2);
      expect(allMetadata.get(TestModel1)).toBe(metadata1);
      expect(allMetadata.get(TestModel2)).toBe(metadata2);
    });

    it('should clear all metadata', () => {
      class TestModel {}
      const metadata: ModelMetadata = {
        tableName: 'test',
        columns: new Map(),
        relationships: new Map()
      };

      metadataStorage.setMetadata(TestModel, metadata);
      expect(metadataStorage.getMetadata(TestModel)).toBe(metadata);

      metadataStorage.clear();
      expect(metadataStorage.getMetadata(TestModel)).toBeUndefined();
    });
  });
});
