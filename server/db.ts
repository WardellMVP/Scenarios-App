/**
 * Database Connection Module
 * 
 * This module handles the connection to the PostgreSQL database using Drizzle ORM.
 * It configures the connection based on environment variables and exports the DB client.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { DATABASE } from './config';

// Configure Neon Database to use WebSockets
neonConfig.webSocketConstructor = ws;

// Validate database connection string
if (!DATABASE.URL) {
  throw new Error(
    "DATABASE_URL must be set. Ensure the database is provisioned.",
  );
}

/**
 * Create PostgreSQL connection pool
 * This is used for database operations and session storage
 */
export const pool = new Pool({ connectionString: DATABASE.URL });

/**
 * Initialize Drizzle ORM with our schema
 * This provides type-safe database operations
 */
export const db = drizzle({ client: pool, schema });

/**
 * Check database connectivity
 * @returns {Promise<boolean>} true if connected successfully
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    client.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
