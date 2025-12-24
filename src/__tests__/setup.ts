import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Increase timeout for database operations
jest.setTimeout(10000);
