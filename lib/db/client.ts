import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { databaseUrl } from "@/lib/env";

// Required in production; falls back to the local Supabase stack (loudly) in dev.
const url = databaseUrl();

// `prepare: false` keeps compatibility with connection poolers (Supabase pgbouncer /
// Supavisor transaction mode). Pool sized small for serverless: each Vercel
// function instance keeps its own pool, so a large `max` × many instances would
// exhaust the database's connection limit. `idle_timeout` releases connections a
// warm instance is no longer using. Override `max` via DB_POOL_MAX if needed.
export const sql = postgres(url, {
  prepare: false,
  max: Number(process.env.DB_POOL_MAX) || 5,
  idle_timeout: 20, // seconds
  connect_timeout: 10, // seconds
});
export const db = drizzle(sql, { schema });

export type DB = typeof db;
