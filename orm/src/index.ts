// Main ORM exports

// Core classes
export { Connection } from './core/Connection';
export { MetadataStorage, metadataStorage } from './core/MetadataStorage';
export { Schema } from './core/Schema';
export { Table } from './decorators/Table';
export { Column } from './decorators/Column';
export { PrimaryKey } from './decorators/PrimaryKey';
export { OneToMany, ManyToOne, ManyToMany } from './decorators/Relationship';

// Types
export * from './types';

// Initialize reflect-metadata
import 'reflect-metadata';
