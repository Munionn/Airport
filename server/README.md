# NestJS Airport Management System

This project demonstrates how to connect NestJS to PostgreSQL using the `pg` library without an ORM, based on the airport management system physical model.

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Database Setup

Make sure PostgreSQL is running on your system, then create a database:

```sql
CREATE DATABASE airport_management_system;
```

### 3. Environment Configuration

Create a `.env` file in the server directory with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=airport_management_system
DB_USER=postgres
DB_PASSWORD=your_password_here

# Application Configuration
PORT=3000
NODE_ENV=development
```

### 4. Database Schema

Run the SQL commands from `database-schema.sql` to create the necessary tables:

```bash
psql -U postgres -d airport_management_system -f database-schema.sql
```

### 5. Start the Application

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
```

## API Endpoints

Once the server is running, you can test the following endpoints:

### Users Management
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `GET /users/username/:username` - Get user by username
- `GET /users/email/:email` - Get user by email
- `GET /users/search?q=term` - Search users by name or email
- `GET /users/status/:status` - Get users by status (active/inactive)
- `GET /users/with-roles` - Get users with their roles
- `GET /users/:id/roles` - Get user roles
- `POST /users` - Create a new user
- `PUT /users/:id` - Update a user
- `PUT /users/:id/activate` - Activate a user
- `PUT /users/:id/deactivate` - Deactivate a user (soft delete)
- `POST /users/:id/roles` - Assign role to user
- `DELETE /users/:id/roles/:roleId` - Remove role from user
- `DELETE /users/:id` - Hard delete a user

### Example API Usage

```bash
# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password_hash": "$2b$10$hashedpassword",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "date_of_birth": "1990-01-01",
    "passport_number": "A1234567"
  }'

# Get all users
curl http://localhost:3000/users

# Search users
curl "http://localhost:3000/users/search?q=john"

# Get users with roles
curl http://localhost:3000/users/with-roles

# Assign role to user
curl -X POST http://localhost:3000/users/1/roles \
  -H "Content-Type: application/json" \
  -d '{"role_id": 2, "assigned_by": 1}'
```

## Project Structure

```
src/
├── database/
│   ├── database.service.ts    # PostgreSQL connection service
│   └── database.module.ts      # Database module
├── users/
│   ├── users.controller.ts     # Users API endpoints
│   ├── users.service.ts        # Users business logic
│   └── users.module.ts         # Users module
├── app.module.ts               # Main application module
└── main.ts                     # Application entry point
```

## Database Schema

The application uses the airport management system schema with the following key tables:

- **Users**: User accounts with authentication and profile information
- **Roles**: System roles with permissions
- **User_Roles**: Many-to-many relationship between users and roles

### Key Features

- **Connection Pooling**: Uses pg's built-in connection pooling for better performance
- **Transaction Support**: Includes transaction methods for complex operations
- **Type Safety**: Full TypeScript support with proper typing
- **Error Handling**: Proper error handling and connection management
- **Environment Configuration**: Configurable via environment variables
- **Role-Based Access**: User role management system
- **Soft Delete**: Users can be deactivated instead of permanently deleted
- **Search Functionality**: Full-text search across user fields
- **Data Validation**: Database-level constraints and validation

## Database Service Methods

The `DatabaseService` provides the following methods:

- `query<T>(text: string, params?: any[])`: Execute a query
- `transaction<T>(callback: (client: PoolClient) => Promise<T>)`: Execute operations in a transaction
- `getClient()`: Get a client from the pool for manual management
- `getPool()`: Get the pool instance for advanced usage

## User Management Features

- **CRUD Operations**: Full Create, Read, Update, Delete operations
- **Role Management**: Assign and remove roles from users
- **Status Management**: Activate/deactivate users
- **Search**: Search users by name, email, or username
- **Validation**: Email format, phone format, passport format validation
- **Age Validation**: Minimum age requirement (16 years)
- **Audit Trail**: Automatic updated_at timestamp management