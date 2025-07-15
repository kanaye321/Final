import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const { Pool } = pg;
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("Available environment variables:", Object.keys(process.env).filter(key => key.includes('DATABASE')));
  console.error("Current working directory:", process.cwd());
  
  throw new Error(
    "DATABASE_URL must be set. Please ensure:\n" +
    "1. Replit PostgreSQL database is provisioned\n" +
    "2. DATABASE_URL environment variable is available\n" +
    "3. Database connection is properly configured"
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
export const db = drizzle(pool, { schema });
