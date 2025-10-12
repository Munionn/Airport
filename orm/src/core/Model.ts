import { metadataStorage } from './MetadataStorage';
import { Connection } from './Connection';
import { ModelMetadata, ColumnMetadata, RelationshipMetadata } from '../types';

export class Model {
  
  protected static connection: Connection;

  static setConnection(connection: Connection) {
    this.connection = connection;
  }

  protected static getMetadata() : ModelMetadata | undefined {
    return metadataStorage.getMetadata(this);
  }

  protected static getTableName() : string | undefined {
    const metadata = this.getMetadata();
    if(!metadata) {
      throw new Error('metadata not found');
    
    }
    return metadata.tableName;
  }

  protected static getPrimaryKey() : string | undefined {
    const metadata = this.getMetadata();
    if(!metadata) {
      throw new Error('metadata not found');
    }
    return metadata.primaryKey;
  }
  protected static getColumns() : Map<string, ColumnMetadata> {
    const metadata = this.getMetadata();
    if(!metadata) {
      throw new Error('metadata not found');
    }
    return metadata.columns;
  }
  
  protected static getRealationships() : Map<string, RelationshipMetadata> {
    const metadata = this.getMetadata();
    if(!metadata) {
      throw new Error('metadata not found');
    }
    return metadata.relationships;
  }

  
  
}