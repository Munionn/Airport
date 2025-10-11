# Airport ORM - Phase 1: Project Setup & Core Infrastructure

## Overview

This is Phase 1 of the custom TypeScript ORM implementation for the Airport Management System. This phase establishes the foundational infrastructure needed for the ORM.

## What's Implemented

### 1. Project Setup
- ✅ TypeScript configuration (`tsconfig.json`)
- ✅ Package configuration (`package.json`) with required dependencies
- ✅ Directory structure for organized code

### 2. Core Infrastructure

#### Connection Management (`src/orm/core/Connection.ts`)
- PostgreSQL connection pooling using `pg` library
- Singleton pattern for global connection management
- Transaction support (begin, commit, rollback)
- Error handling and connection lifecycle management

#### Metadata Storage (`src/orm/core/MetadataStorage.ts`)
- Singleton metadata storage using `reflect-metadata`
- Stores table and column definitions
- Provides methods to retrieve metadata for models
- Supports debugging and testing scenarios

#### Schema Utilities (`src/orm/core/Schema.ts`)
- Database introspection capabilities
- Table existence checking
- Primary key and foreign key detection
- SQL generation for table creation/dropping

#### Type Definitions (`src/types/index.ts`)
- Comprehensive TypeScript interfaces
- Connection configuration types
- Column and table option types
- Query building types
- Migration and relationship types

## Dependencies

- `pg` - PostgreSQL driver for Node.js
- `reflect-metadata` - Metadata reflection for decorators
- `@types/pg` - TypeScript definitions for pg
- `@types/node` - TypeScript definitions for Node.js

## Usage Example

```typescript
import { Connection, ConnectionConfig } from './src/index';

const config: ConnectionConfig = {
  host: 'localhost',
  port: 5432,
  database: 'airport_management_system',
  username: 'airport_admin',
  password: 'airport123'
};

const connection = Connection.getInstance(config);
const result = await connection.query('SELECT NOW()');
```

## Testing

Run the example to test Phase 1:
```bash
cd orm
npm install
ts-node src/example.ts
```

## Next Steps (Phase 2)

Phase 2 will implement the decorator system:
- `@Table()` decorator for marking model classes
- `@Column()` decorator for field mapping
- `@PrimaryKey()` decorator for primary keys
- Metadata reflection system integration

## Architecture Notes

The ORM follows a modular architecture:
- **Core**: Essential database operations and metadata management
- **Decorators**: TypeScript decorators for model definition
- **Types**: Comprehensive type definitions
- **Future modules**: Query builder, relationships, migrations, transactions

This foundation provides the necessary infrastructure for building higher-level ORM features in subsequent phases.
