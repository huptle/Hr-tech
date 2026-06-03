import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Prefer server-only vars so Docker/VPS `.env` works at runtime without rebuilding
 * the apply image. NEXT_PUBLIC_* is fallback for local dev.
 */
function supabaseConfig(): { url: string; key: string } {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "";
  const key =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_*).",
    );
  }

  return { url, key };
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const { url, key } = supabaseConfig();
    client = createClient(url, key);
  }
  return client;
}

/** @deprecated Prefer getSupabase() — kept for existing imports. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getSupabase();
    const value = c[prop as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(c) : value;
  },
});
