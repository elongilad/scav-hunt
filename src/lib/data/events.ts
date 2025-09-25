import { createServerClient } from "@/lib/supabase/server";

export async function routeNext(opts: { eventId: string; teamId: string; fromNodeId: string }) {
  const supabase = await createServerClient();
  // If you implemented as a SQL RPC:
  // const { data, error } = await supabase.rpc('route_next', opts);
  // return { data, error };
  // Or hit your server route instead:
}
