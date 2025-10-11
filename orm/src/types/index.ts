// Type definitions for the ORM

export interface ForeignKeyOptions {
  
}

export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  max?: number; // max connections in pool
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface ColumnOptions {
  type: string;
  length?: number;
  nullable?: boolean;
  unique?: boolean;
  generated?: boolean;
  default?: any;
  comment?: string;
}

export interface TableOptions {
  name: string;
  schema?: string;
  comment?: string;
}

export interface RelationshipOptions {
  target: () => any;
  inverseSide?: string;
  cascade?: boolean;
  eager?: boolean;
  lazy?: boolean;
}

export interface QueryCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL';
  value?: any;
}

export interface JoinOptions {
  table: string;
  alias?: string;
  condition: string;
  type?: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
}

export interface OrderByOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface MigrationOptions {
  name: string;
  up: string;
  down: string;
}

export interface ModelMetadata {
  tableName: string;
  columns: Map<string, ColumnMetadata>;
  primaryKey?: string;
  relationships: Map<string, RelationshipMetadata>;
}

export interface ColumnMetadata {
  name: string;
  propertyName: string;
  type: string;
  options: ColumnOptions;
}

export interface RelationshipMetadata {
  type: 'OneToMany' | 'ManyToOne' | 'ManyToMany';
  target: () => any;
  propertyName: string;
  inverseSide?: string;
  options: RelationshipOptions;
}
