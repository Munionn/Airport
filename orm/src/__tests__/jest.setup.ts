import 'reflect-metadata';

// Test database configuration
export const testConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'airport_management_system',
  username: process.env.DB_USER || 'airport_admin',
  password: process.env.DB_PASSWORD || 'airport123',
  ssl: false,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000
};

// Global test timeout
jest.setTimeout(10000);
