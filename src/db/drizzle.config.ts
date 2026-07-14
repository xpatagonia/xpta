import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file.
dotenv.config();

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER;
const password = process.env.SQL_ADMIN_PASSWORD;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  if (!sqlHost) {
    throw new Error("SQL_HOST or DATABASE_URL must be set in environment variables.");
  }
  if (!sqlDbName) {
    throw new Error("SQL_DB_NAME or DATABASE_URL must be set in environment variables.");
  }
  if (!user) {
    throw new Error("SQL_ADMIN_USER or DATABASE_URL must be set in environment variables.");
  }
  if (!password) {
    throw new Error("SQL_ADMIN_PASSWORD or DATABASE_URL must be set in environment variables.");
  }
  console.log(`Using user: ${user} to connect to database.`);
} else {
  console.log('Using DATABASE_URL to connect to database.');
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  ...(databaseUrl 
    ? { dbCredentials: { url: databaseUrl } }
    : {
        dbCredentials: {
          host: sqlHost as string,
          user: user as string,
          password: password as string,
          database: sqlDbName as string,
          ssl: false,
        }
      }
  ),
  verbose: true,
});
