"use server";

import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";

const RouteInput = z.object({
  eventId: z.string().uuid(),
  teamId: z.string().uuid(),
  fromNodeId: z.string().uuid(),
});

export type RouteResult =
  | { ok: true; toNodeId: string; payload?: any }
  | { ok: false; error: string };

export async function routeNext(input: z.infer<typeof RouteInput>): Promise<RouteResult> {
  const parsed = RouteInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  await requireAuth(); // or let anonymous team play; up to you
  const supabase = await createServerClient();

  // RPC: returns { to_node_id uuid, payload jsonb }
  const { data, error } = await supabase.rpc("route_next", {
    p_event_id: parsed.data.eventId,
    p_team_id: parsed.data.teamId,
    p_from_node_id: parsed.data.fromNodeId,
  });

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "No route found" };

  return { ok: true, toNodeId: data.to_node_id, payload: data.payload ?? null };
}
