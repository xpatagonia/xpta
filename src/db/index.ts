import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

export const createPool = () => {
  if (process.env.DATABASE_URL) {
    // Corregimos la URL si el usuario pegó arrobas de más (ej. @@@db...)
    let dbUrl = process.env.DATABASE_URL.replace(/@+db/, '@db');
    
    try {
      const url = new URL(dbUrl);
      if (url.hostname === 'db.cjbafuclfgdexapfmyzd.supabase.co') {
        url.hostname = 'aws-0-us-east-1.pooler.supabase.com';
        url.port = '6543';
        url.username = 'postgres.cjbafuclfgdexapfmyzd';
        dbUrl = url.toString();
      }
    } catch (e) {
      console.warn("Could not parse DATABASE_URL");
    }

    return new Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 15000,
    });
  }

  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });
