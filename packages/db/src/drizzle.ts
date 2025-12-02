import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDrizzleClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString, {
    prepare: false, // Disable prefetch for Supabase connection pooling compatibility
  });

  return drizzle(client, { schema });
}

// Lazy initialization to avoid errors when env vars aren't set at import time
let _db: ReturnType<typeof createDrizzleClient> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDrizzleClient();
  }
  return _db;
}

// For direct import (will throw if DATABASE_URL not set at module load)
export const db = new Proxy({} as ReturnType<typeof createDrizzleClient>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof createDrizzleClient>];
  },
});
