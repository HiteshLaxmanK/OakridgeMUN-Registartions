import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
    global: {
      // Next.js patches the global fetch() and caches GET requests by default.
      // Without this, a route can keep serving a stale Supabase response
      // (e.g. "0 delegates") forever after the underlying data changes.
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  return client;
}

// Service-role client, server-side only, created lazily on first real use.
// Next.js evaluates route modules during `next build`, so validating env vars
// eagerly at import time can fail the whole build even when they're fine at
// runtime (or fail it obscurely when they're genuinely missing). Deferring
// the check to first use turns that into a normal per-request 500 instead.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = getClient();
    const value = Reflect.get(real, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export const LIABILITY_FORMS_BUCKET = "liability-forms";
