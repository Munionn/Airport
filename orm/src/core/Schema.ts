import { Connection } from './Connection';
import { metadataStorage } from './MetadataStorage';
import { ModelMetadata, ColumnMetadata } from '../types';

export class Schema {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Get table information from database
   */
  async getTableInfo(tableName: string): Promise<any[]> {
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `;
    
    const result = await this.connection.query(query, [tableName]);
    return result.rows;
  }

  /**
   * Get primary key information for a table
   */
  async getPrimaryKey(tableName: string): Promise<string | null> {
    const query = `
      SELECT column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = $1 
        AND tc.constraint_type = 'PRIMARY KEY'
    `;
    
    const result = await this.connection.query(query, [tableName]);
    return result.rows.length > 0 ? result.rows[0].column_name : null;
  }

  /**
   * Get foreign key information for a table
   */
  async getForeignKeys(tableName: string): Promise<any[]> {
    const query = `
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = $1
    `;
    
    const result = await this.connection.query(query, [tableName]);
    return result.rows;
  }

  /**
   * Check if a table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `;
    
    const result = await this.connection.query(query, [tableName]);
    return result.rows[0].exists;
  }

  /**
   * Get all table names in the database
   */
  async getAllTables(): Promise<string[]> {
    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const result = await this.connection.query(query);
    return result.rows.map(row => row.table_name);
  }

  /**
   * Generate SQL for creating a table based on model metadata
   */
  generateCreateTableSQL(metadata: ModelMetadata): string {
    const columns: string[] = [];
    
    metadata.columns.forEach((columnMeta: ColumnMetadata) => {
      let columnDef = `${columnMeta.name} ${columnMeta.type}`;
      
      if (columnMeta.options.length) {
        columnDef += `(${columnMeta.options.length})`;
      }
      
      if (columnMeta.options.nullable === false) {
        columnDef += ' NOT NULL';
      }
      
      if (columnMeta.options.unique) {
        columnDef += ' UNIQUE';
      }
      
      if (columnMeta.options.default !== undefined) {
        columnDef += ` DEFAULT ${columnMeta.options.default}`;
      }
      
      if (columnMeta.options.generated) {
        columnDef += ' GENERATED ALWAYS AS IDENTITY';
      }
      
      columns.push(columnDef);
    });
    
    // Add primary key constraint
    if (metadata.primaryKey) {
      columns.push(`PRIMARY KEY (${metadata.primaryKey})`);
    }
    
    return `CREATE TABLE ${metadata.tableName} (\n  ${columns.join(',\n  ')}\n);`;
  }

  /**
   * Generate SQL for dropping a table
   */
  generateDropTableSQL(tableName: string): string {
    return `DROP TABLE IF EXISTS ${tableName};`;
  }
}
