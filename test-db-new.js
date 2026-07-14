import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:Enbuscade666@db.cjbafuclfgdexapfmyzd.supabase.co:5432/postgres',
  connectionTimeoutMillis: 5000,
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Success without @:', res.rows[0]);
  }
  pool.end();
});
