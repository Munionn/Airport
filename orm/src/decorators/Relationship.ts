import { metadataStorage } from '../core/MetadataStorage';
import { RelationshipOptions } from '../types';


export function OneToMany(target: () => any, inverseSide?: string) {
  return function (target: any, propertyName: string) {
    const relationshipOptions: RelationshipOptions = {
      target,
      inverseSide,
      lazy: true,
    }
    let metadata = metadataStorage.getMetadata(target.constructor);
    if (!metadata) {
      metadata = {
        tableName: target.constructor.name.toLowerCase(),
        columns: new Map(),
        relationships: new Map(),
      };
    }
    metadata.relationships.set(propertyName, {
      type: 'OneToMany',
      target,
      propertyName,
      options: relationshipOptions,
    })
    metadataStorage.setMetadata(target.constructor, metadata);
    Reflect.defineMetadata('relationship', relationshipOptions, target, propertyName);
  }
}

export function ManyToOne(target: () => any, inverseSide?: string) {
  return function (target: any, propertyName: string) {
    const relationshipOptions: RelationshipOptions = {
      target,
      inverseSide,
      lazy: true,
    }
    let metadata = metadataStorage.getMetadata(target.constructor);
    if (!metadata) {
      metadata = {
        tableName: target.constructor.name.toLowerCase(),
        columns: new Map(),
        relationships: new Map(),
      };
    }
    metadata.relationships.set(propertyName, {
      type: 'ManyToOne',
      target,
      propertyName,
      options: relationshipOptions,
    })
    metadataStorage.setMetadata(target.constructor, metadata);
    Reflect.defineMetadata('relationship', relationshipOptions, target, propertyName);
  }
}

export function ManyToMany(target: () => any, inverseSide?: string) {
  return function (target: any, propertyName: string) {
    const relationshipOptions: RelationshipOptions = {
      target,
      inverseSide,
      lazy: true,
    }
    let metadata = metadataStorage.getMetadata(target.constructor);
    if (!metadata) {
      metadata = {
        tableName: target.constructor.name.toLowerCase(),
        columns: new Map(),
        relationships: new Map(),
      };
    }
    metadata.relationships.set(propertyName, {
      type: 'ManyToMany',
      target,
      propertyName,
      options: relationshipOptions,
    })
    metadataStorage.setMetadata(target.constructor, metadata);
    Reflect.defineMetadata('relationship', relationshipOptions, target, propertyName);
  }
}