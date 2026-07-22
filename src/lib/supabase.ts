import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
}

// Service-role client, server-side only. Every request into this app already
// goes through our own API routes behind the admin password gate, so there is
// no separate end-user auth/RLS layer to model here.
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
  global: {
    // Next.js patches the global fetch() and caches GET requests by default.
    // Without this, a route can keep serving a stale Supabase response
    // (e.g. "0 delegates") forever after the underlying data changes.
    fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
  },
});

export const LIABILITY_FORMS_BUCKET = "liability-forms";
