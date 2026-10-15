import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if Supabase credentials are present.
 */
export function isSupabaseConfigured(): boolean {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

function supabaseConfig(): { url: string; key: string } | null {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "";
  const key =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  if (!url || !key) return null;
  return { url, key };
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!client) {
    const config = supabaseConfig();
    if (!config) return null;
    client = createClient(config.url, config.key);
  }
  return client;
}

/** @deprecated Prefer getSupabase() — kept for existing imports with safe fallback. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getSupabase();
    if (!c) {
      console.warn(`[supabase] Supabase is not configured; skipping call to '${String(prop)}'`);
      return () => ({ data: null, error: new Error("Supabase is not configured.") });
    }
    const value = c[prop as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(c) : value;
  },
});
