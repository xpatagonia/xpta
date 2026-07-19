import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index.ts';
async function main() {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migration done');
  process.exit(0);
}
main();
