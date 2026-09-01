import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for the Sprout webhook route: Zapier's POST has no
// Supabase session, so RLS (which only grants access to `authenticated`)
// would otherwise block the insert. The webhook route is the only caller —
// gate it there with SPROUT_WEBHOOK_TOKEN before ever using this client.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
