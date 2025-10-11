import { Connection, ConnectionConfig } from './index';

// Example usage of Phase 1 components

async function demonstratePhase1() {
  // Database connection configuration
  const config: ConnectionConfig = {
    host: 'localhost',
    port: 5432,
    database: 'airport_management_system',
    username: 'airport_admin',
    password: 'airport123',
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  };

  try {
    // Initialize connection
    const connection = Connection.getInstance(config);
    
    // Test basic query
    const result = await connection.query('SELECT NOW() as current_time');
    console.log('Database connection successful:', result.rows[0]);
    
    // Test transaction
    const client = await connection.beginTransaction();
    try {
      await connection.queryWithClient(client, 'SELECT 1 as test');
      await connection.commitTransaction(client);
      console.log('Transaction test successful');
    } catch (error) {
      await connection.rollbackTransaction(client);
      console.error('Transaction rolled back:', error);
    }
    
    // Close connection
    await connection.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run demonstration if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  demonstratePhase1();
}
