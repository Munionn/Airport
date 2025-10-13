import { metadataStorage } from './MetadataStorage';
import { Connection } from './Connection';
import { QueryBuilder } from './QueryBuilder';
import { ModelMetadata, ColumnMetadata, RelationshipMetadata } from '../types';

export class Model {
  
  protected static connection: Connection;

  static setConnection(connection: Connection) {
    this.connection = connection;
  }

  static getConnection(): Connection {
    return this.connection;
  }

  static getMetadata(): ModelMetadata | undefined {
    return metadataStorage.getMetadata(this);
  }

  static getTableName(): string | undefined {
    return metadataStorage.getTableName(this);
  }

  static getPrimaryKey(): string | undefined {
    return metadataStorage.getPrimaryKey(this);
  }

  static getColumnMetadata(propertyName: string): ColumnMetadata | undefined {
    return metadataStorage.getColumnMetadata(this, propertyName);
  }

  static getAllColumns(): Map<string, ColumnMetadata> {
    return metadataStorage.getAllColumns(this);
  }

  static getRelationshipMetadata(propertyName: string): RelationshipMetadata | undefined {
    return metadataStorage.getRelationshipMetadata(this, propertyName);
  }

  static getAllRelationships(): Map<string, RelationshipMetadata> {
    return metadataStorage.getAllRelationships(this);
  }

  /**
   * Find a record by its primary key
   * @param id - The primary key value
   * @returns Promise<T | null> - The found record or null if not found
   */
  static async find<T extends Model>(this: typeof Model, id: any): Promise<T | null> {
    const metadata = this.getMetadata();
    if (!metadata) {
      throw new Error(`No metadata found for model ${this.name}`);
    }

    const primaryKey = this.getPrimaryKey();
    if (!primaryKey) {
      throw new Error(`No primary key defined for model ${this.name}`);
    }

    const tableName = this.getTableName();
    if (!tableName) {
      throw new Error(`No table name defined for model ${this.name}`);
    }

    const connection = this.getConnection();
    if (!connection) {
      throw new Error(`No connection set for model ${this.name}`);
    }

    const queryBuilder = new QueryBuilder<T>(connection, tableName);
    const result = await queryBuilder
      .select()
      .where(primaryKey, id)
      .getOne();

    if (!result) { 
      return null;
    }

    // Create a new instance and populate it with the result data
    const instance = new (this as any)();
    Object.assign(instance, result);
    return instance;
  }

  /**
   * Get a QueryBuilder instance for this model
   * @returns QueryBuilder instance configured for this model's table
   */
  static query<T extends Model>(this: typeof Model): QueryBuilder<T> {
    const tableName = this.getTableName();
    if (!tableName) {
      throw new Error(`No table name defined for model ${this.name}`);
    }

    const connection = this.getConnection();
    if (!connection) {
      throw new Error(`No connection set for model ${this.name}`);
    }

    return new QueryBuilder<T>(connection, tableName);
  }
}