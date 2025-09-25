"use server";

import { z } from "zod";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const CompileInput = z.object({ eventId: z.string().uuid() });

export type CompileResult =
  | { ok: true; enqueued: number }
  | { ok: false; error: string };

export async function compileEvent(input: z.infer<typeof CompileInput>): Promise<CompileResult> {
  const parsed = CompileInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const user = await requireAuth();
  const rls = await createServerClient();
  const admin = createAdminClient();

  // Authz
  const { data: ev, error } = await rls
    .from("events")
    .select("id, org_id")
    .eq("id", parsed.data.eventId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!ev) return { ok: false, error: "Event not found" };

  await requireOrgAccess({ userId: user.id, orgId: ev.org_id, minRole: "editor" });

  // Enqueue jobs for each event_mission (idempotent on (org_id, event_mission_id))
  const { data: missions, error: mErr } = await admin
    .from("event_mission_overrides")
    .select("id")
    .eq("event_id", ev.id);

  if (mErr) return { ok: false, error: mErr.message };

  let enqueued = 0;
  for (const m of missions ?? []) {
    // idempotent insert: rely on a unique constraint in render_jobs schema
    const { error: qErr } = await admin.from("render_jobs").insert({
      // Adjust fields to your render_jobs schema
      event_mission_id: m.id,
      requested_by: user.id,
      status: "queued",
    });
    if (!qErr) enqueued++;
  }

  // Flip event status to "ready" or keep "draft" until finished — up to you.
  return { ok: true, enqueued };
}
