import { ColumnOptions } from '../types';
import { metadataStorage } from '../core/MetadataStorage';

export function Column(options: ColumnOptions) {
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

    // Create column metadata
    const columnMetadata = {
      name: propertyName,
      propertyName: propertyName,
      type: options.type,
      options: options,
    };

    // Add column to metadata
    metadata.columns.set(propertyName, columnMetadata);

    // Store the updated metadata
    metadataStorage.setMetadata(target.constructor, metadata);

    // Store column options in metadata for reflection
    Reflect.defineMetadata('column', options, target, propertyName);
  };
}
