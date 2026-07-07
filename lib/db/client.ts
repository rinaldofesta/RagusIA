import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { databaseUrl } from "@/lib/env";

// Required in production; falls back to the local Supabase stack (loudly) in dev.
const url = databaseUrl();

// `prepare: false` keeps compatibility with connection poolers (Supabase pgbouncer).
export const sql = postgres(url, { prepare: false });
export const db = drizzle(sql, { schema });

export type DB = typeof db;
