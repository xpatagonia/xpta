import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

export const hasDatabaseConfig = (): boolean => {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.SQL_HOST && process.env.SQL_DB_NAME && process.env.SQL_USER)
  );
};

export const createPool = () => {
  if (process.env.DATABASE_URL) {
    let dbUrl = process.env.DATABASE_URL.replace(/@+db\./, '@db.').trim();
    let isLocal = false;

    try {
      const url = new URL(dbUrl);
      isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

      // Optional pooler rewrite when SUPABASE_POOLER_HOST is explicitly configured
      if (process.env.SUPABASE_POOLER_HOST && url.hostname.endsWith('.supabase.co')) {
        const projectRef = url.hostname.split('.')[1];
        url.hostname = process.env.SUPABASE_POOLER_HOST;
        url.port = process.env.SUPABASE_POOLER_PORT || '6543';
        if (projectRef && !url.username.includes('.')) {
          url.username = `${url.username}.${projectRef}`;
        }
        dbUrl = url.toString();
      }
    } catch {
      console.warn('[XPATAGONIA] Could not parse DATABASE_URL');
    }

    const maxConnections = process.env.VERCEL ? 5 : 10;

    return new Pool({
      connectionString: dbUrl,
      max: maxConnections,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
  }

  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    max: process.env.VERCEL ? 5 : 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 15000,
    ssl:
      !process.env.SQL_HOST ||
      process.env.SQL_HOST === 'localhost' ||
      process.env.SQL_HOST === '127.0.0.1'
        ? false
        : { rejectUnauthorized: false },
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });
