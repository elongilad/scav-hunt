"use server";

import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

// If you want this open to teams without auth, you can skip requireAuth here.
// For admin views, keep auth enforced.
const LogInput = z.object({
  eventId: z.string().uuid(),
  teamId: z.string().uuid(),
  nodeId: z.string().uuid(),
  state: z.enum(["enter", "complete", "fail"]),
});

export type LogResult = { ok: true } | { ok: false; error: string };

export async function logVisit(input: z.infer<typeof LogInput>): Promise<LogResult> {
  const parsed = LogInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("event_visits")
    .insert({
      event_id: parsed.data.eventId,
      team_id: parsed.data.teamId,
      node_id: parsed.data.nodeId,
      state: parsed.data.state,
    });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
