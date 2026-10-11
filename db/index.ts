import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalDb = globalThis as typeof globalThis & { blogPool?: Pool };
// Create the connection lazily, so a production build does not need a database.
export function getDb() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      "DATABASE_URL is required. Configure an isolated PostgreSQL database; see README.md.",
    );
  const pool =
    globalDb.blogPool ??
    new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  globalDb.blogPool = pool;
  return drizzle(pool, { schema });
}
