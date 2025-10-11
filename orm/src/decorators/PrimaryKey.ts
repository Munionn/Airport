import { metadataStorage } from '../core/MetadataStorage';

export function PrimaryKey() {
  return function (target: any, propertyName: string) {
    // Get or create metadata for this class
    let metadata = metadataStorage.getMetadata(target.constructor);
    if (!metadata) {
      metadata = {
        tableName: target.constructor.name.toLowerCase(),
        columns: new Map(),
        relationships: new Map(),
      };
    }


    metadata.primaryKey = propertyName;


    metadataStorage.setMetadata(target.constructor, metadata);

    Reflect.defineMetadata('primaryKey', true, target, propertyName);
  };
}