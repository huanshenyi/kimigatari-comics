import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Server-side client (with service role key for full access)
export function createServerClient(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Browser client (with anon key, respects RLS policies)
export function createBrowserClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables"
    );
  }

  return createClient<Database>(url, key);
}

// Get the appropriate client based on environment
let serverClient: SupabaseClient<Database> | null = null;

export function getServerClient(): SupabaseClient<Database> {
  if (!serverClient) {
    serverClient = createServerClient();
  }
  return serverClient;
}
