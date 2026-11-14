import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

function cleanEnvUrl(raw?: string): string {
  return (raw || '').trim().replace(/^['"]|['"]$/g, '');
}

export const hasDatabaseConfig = (): boolean => {
  return Boolean(
    cleanEnvUrl(process.env.DATABASE_URL) ||
      (process.env.SQL_HOST && process.env.SQL_DB_NAME && process.env.SQL_USER)
  );
};

export function formatPgError(err: any): string {
  const cause = err?.cause || err;
  const code = cause?.code || err?.code;
  const msg = String(cause?.message || err?.message || err || 'Unknown Postgres error');
  const detail = cause?.detail ? ` (${cause.detail})` : '';

  if (code === '42P01') {
    return `Tabla inexistente en Postgres (42P01): ${msg}`;
  }
  if (code === '28P01' || /password authentication failed/i.test(msg)) {
    return `Contraseña incorrecta en DATABASE_URL (28P01): verificá tu password de Postgres en Vercel.`;
  }
  if (/Tenant or user not found/i.test(msg)) {
    return `Usuario/Proyecto inválido en Supabase Pooler ("Tenant or user not found"): verificá que el usuario sea postgres.<PROJECT_REF> en DATABASE_URL.`;
  }
  if (code === 'ENETUNREACH' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT') {
    return `No se pudo conectar a Postgres (${code}: ${msg}). Si usás Supabase en Vercel, debés usar la URI del Transaction Pooler (puerto 6543, host *.pooler.supabase.com), no el host directo db.*.supabase.co:5432.`;
  }

  return `${code ? `[${code}] ` : ''}${msg}${detail}`;
}

export const createPool = () => {
  const rawDbUrl = cleanEnvUrl(process.env.DATABASE_URL);
  if (rawDbUrl) {
    let dbUrl = rawDbUrl.replace(/@+db\./, '@db.').trim();
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

export const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });
