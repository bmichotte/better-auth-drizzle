import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "@/db/schema";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle(pool, {
  casing: "snake_case",
  // logger: true,
  schema,
});

export type db = typeof db;

export default db;
