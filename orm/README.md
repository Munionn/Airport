# Airport ORM - Custom TypeScript ORM Implementation

## Overview

A custom TypeScript ORM implementation for the Airport Management System with PostgreSQL support. This ORM provides a fluent query builder, decorator-based model definitions, and comprehensive database operations.

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

#### QueryBuilder (`src/core/QueryBuilder.ts`)
- Fluent API for building SQL queries
- Support for SELECT, INSERT, UPDATE, DELETE operations
- Complex WHERE conditions with AND/OR logic
- JOIN operations (INNER, LEFT, RIGHT, FULL)
- GROUP BY, HAVING, ORDER BY, LIMIT, OFFSET
- Parameterized queries for SQL injection protection
- Raw SQL support for custom queries
- Type-safe generic support

#### Schema Utilities (`src/core/Schema.ts`)
- Database introspection capabilities
- Table existence checking
- Primary key and foreign key detection
- SQL generation for table creation/dropping

#### Model Base Class (`src/core/Model.ts`)
- Base class for all ORM models
- Metadata access methods
- Connection management
- Foundation for CRUD operations

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

## Usage Examples

### Basic Connection
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
```

### QueryBuilder Examples

#### SELECT Queries
```typescript
import { QueryBuilder } from './src/index';

// Basic SELECT
const users = await QueryBuilder.create(connection, 'users')
  .select(['id', 'name', 'email'])
  .where('active', true)
  .orderBy('name', 'ASC')
  .limit(10)
  .getMany();

// Complex query with joins
const userPosts = await QueryBuilder.create(connection)
  .select(['u.name', 'p.title', 'p.content'])
  .from('users u')
  .leftJoin('posts p', 'u.id = p.user_id')
  .where('u.active', true)
  .orderBy('p.created_at', 'DESC')
  .getMany();
```

#### INSERT Operations
```typescript
const newUser = await QueryBuilder.create(connection, 'users')
  .insert({
    name: 'John Doe',
    email: 'john@example.com',
    active: true
  })
  .execute();
```

#### UPDATE Operations
```typescript
await QueryBuilder.create(connection, 'users')
  .update({ active: false })
  .where('last_login', '<', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  .execute();
```

#### DELETE Operations
```typescript
await QueryBuilder.create(connection, 'users')
  .delete()
  .where('id', 123)
  .execute();
```

#### Aggregation Queries
```typescript
const userPostCounts = await QueryBuilder.create(connection)
  .select(['u.name', 'COUNT(p.id) as post_count'])
  .from('users u')
  .leftJoin('posts p', 'u.id = p.user_id')
  .groupBy('u.id', 'u.name')
  .having({ field: 'post_count', operator: '>', value: 0 })
  .orderBy('post_count', 'DESC')
  .getMany();
```

## Testing

Run the examples to test the ORM:
```bash
cd orm
npm install

# Test basic connection
ts-node src/example.ts

# Test QueryBuilder functionality
ts-node src/test-query-builder.ts

# Run comprehensive QueryBuilder examples
ts-node src/query-builder-example.ts
```

## Features

### ✅ Implemented
- **Connection Management**: PostgreSQL connection pooling with singleton pattern
- **QueryBuilder**: Fluent API for building complex SQL queries
- **Decorators**: `@Table`, `@Column`, `@PrimaryKey`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`
- **Metadata Storage**: Reflection-based metadata management
- **Schema Utilities**: Database introspection and table management
- **Type Safety**: Full TypeScript support with generics
- **SQL Injection Protection**: Parameterized queries throughout

### 🚧 Planned Features
- **Model CRUD Operations**: Complete CRUD methods in Model base class
- **Relationship Loading**: Lazy and eager loading of related entities
- **Migration System**: Database schema versioning and migrations
- **Transaction Support**: Enhanced transaction handling in models
- **CLI Tools**: Command-line tools for migrations and code generation
- **Validation**: Data validation and constraints
- **Caching**: Query result caching
- **Logging**: Comprehensive query and operation logging

## Architecture

The ORM follows a modular architecture:
- **Core**: Essential database operations and metadata management
- **Decorators**: TypeScript decorators for model definition
- **Types**: Comprehensive type definitions
- **QueryBuilder**: Fluent SQL query construction
- **Models**: Base classes and entity management
- **Future modules**: Relationships, migrations, transactions, CLI tools

This provides a solid foundation for building enterprise-grade applications with clean, maintainable code.
