import { TableOptions } from '../types';
import { metadataStorage } from '../core/MetadataStorage';

export function Table(options: TableOptions) {
  return function (target: Function) {
    const tableName = typeof options === "string" ? options : options.name;
    const tableOptions = typeof options === 'object' ? options : { name: options};

    let metadata  = metadataStorage.getMetadata(target);
    if(!metadata) {
      metadata = {
        tableName: tableName,
        columns: new Map(),
        relationships: new Map(),

      }
    }
    else {
      metadata.tableName = tableName;
  
    }
    // store metadata 
    metadataStorage.setMetadata(target, metadata);

    Reflect.defineMetadata('table', tableOptions, target);
  }
}