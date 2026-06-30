import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

// `prepare: false` keeps compatibility with connection poolers (Supabase pgbouncer).
export const sql = postgres(url, { prepare: false });
export const db = drizzle(sql, { schema });

export type DB = typeof db;
