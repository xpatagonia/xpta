import pg from 'pg';
const { Pool } = pg;
const dbUrl = process.env.DATABASE_URL.replace('@@', '@');
console.log('Testing with url:', dbUrl.replace(/:[^:@]*@/, ':***@'));
const pool = new Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 5000,
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Success:', res.rows[0]);
  }
  pool.end();
});
