import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const createPool = () => {
  if (process.env.DATABASE_URL) {
    let dbUrl = process.env.DATABASE_URL.replace(/@+db/, '@db');
    try {
      const url = new URL(dbUrl);
      if (url.hostname === 'db.cjbafuclfgdexapfmyzd.supabase.co') {
        url.hostname = 'aws-0-us-east-1.pooler.supabase.com';
        url.port = '6543';
        url.username = 'postgres.cjbafuclfgdexapfmyzd';
        dbUrl = url.toString();
      }
    } catch (e) {}
    return new Pool({ connectionString: dbUrl });
  }
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
  });
};

const pool = createPool();
pool.query("SELECT * FROM insights ORDER BY created_at DESC LIMIT 5", (err, res) => {
  if (err) console.error(err);
  else console.log(res.rows);
  pool.end();
});
