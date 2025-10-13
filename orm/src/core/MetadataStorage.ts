import 'reflect-metadata';
import { ModelMetadata, ColumnMetadata, RelationshipMetadata } from '../types';


export type { ModelMetadata, ColumnMetadata, RelationshipMetadata };

export class MetadataStorage {
  private static instance: MetadataStorage;
  private metadata: Map<Function, ModelMetadata> = new Map();

  static getInstance(): MetadataStorage {
    if (!MetadataStorage.instance) {
      MetadataStorage.instance = new MetadataStorage();
    }
    return MetadataStorage.instance;
  }

  getMetadata(target: Function): ModelMetadata | undefined {
    return this.metadata.get(target);
  }

  setMetadata(target: Function, metadata: ModelMetadata): void {
    this.metadata.set(target, metadata);
  }

  getColumnMetadata(target: Function, propertyName: string): ColumnMetadata | undefined {
    const modelMetadata = this.getMetadata(target);
    return modelMetadata?.columns.get(propertyName);
  }

  getRelationshipMetadata(target: Function, propertyName: string): RelationshipMetadata | undefined {
    const modelMetadata = this.getMetadata(target);
    return modelMetadata?.relationships.get(propertyName);
  }

  getPrimaryKey(target: Function): string | undefined {
    const modelMetadata = this.getMetadata(target);
    return modelMetadata?.primaryKey;
  }

  getTableName(target: Function): string | undefined {
    const modelMetadata = this.getMetadata(target);
    return modelMetadata?.tableName;
  }

  getAllColumns(target: Function): Map<string, ColumnMetadata> {
    const modelMetadata = this.getMetadata(target);
    return modelMetadata?.columns || new Map();
  }

  getAllRelationships(target: Function): Map<string, RelationshipMetadata> {
    const modelMetadata = this.getMetadata(target);
    return modelMetadata?.relationships || new Map();
  }

  // Helper method to get all metadata for debugging
  getAllMetadata(): Map<Function, ModelMetadata> {
    return this.metadata;
  }

  // Clear metadata (useful for testing)
  clear(): void {
    this.metadata.clear();
  }
}

// Export singleton instance
export const metadataStorage = MetadataStorage.getInstance();