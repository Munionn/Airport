// Database-related interfaces
export interface DatabaseEntity {
  created_at?: Date;
  updated_at?: Date;
}

export interface SoftDeleteEntity extends DatabaseEntity {
  deleted_at?: Date;
}

export interface AuditEntity extends DatabaseEntity {
  created_by?: number;
  updated_by?: number;
}

export interface LocationEntity {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface ContactEntity {
  email?: string;
  phone?: string;
  mobile?: string;
}

export interface AddressEntity extends LocationEntity {
  street?: string;
  postal_code?: string;
  state?: string;
}

// Query interfaces
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  where?: Record<string, any>;
  include?: string[];
}

export interface SearchOptions extends QueryOptions {
  searchTerm?: string;
  searchFields?: string[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
}

export interface FilterOptions {
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  category?: string;
  [key: string]: any;
}

// Transaction interfaces
export interface TransactionOptions {
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  timeout?: number;
}

export interface BulkOperationOptions {
  batchSize?: number;
  continueOnError?: boolean;
  validateBeforeInsert?: boolean;
}

// Result interfaces
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields: any[];
}

export interface BulkOperationResult {
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; error: string }>;
}

export interface DatabaseStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
}
