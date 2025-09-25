"use server";
import { z } from "zod";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const Input = z.object({
  eventId: z.string().uuid(),
  missionId: z.string().uuid(),
  overrides: z.object({
    enabled: z.boolean().optional(),
    title: z.string().optional(),
    requires_video: z.boolean().optional(),
    requires_photo: z.boolean().optional(),
    requires_actor: z.boolean().optional(),
    hq_candidate: z.boolean().optional(),
    activity_candidate: z.boolean().optional(),
    prop_requirements: z.array(z.string()).optional(),
    expected_minutes: z.number().int().min(1).max(60).optional(),
    p95_minutes: z.number().int().min(1).max(120).optional(),
    variant: z.string().optional()
  })
});

export async function updateMissionOverride(input: z.infer<typeof Input>) {
  const p = Input.parse(input);
  const user = await requireAuth();
  const rls = await createServerClient();

  const { data: evt, error: eErr } = await rls.from("events").select("id, org_id").eq("id", p.eventId).maybeSingle();
  if (eErr || !evt) throw eErr || new Error("Event not found");
  await requireOrgAccess({ userId: user.id, orgId: evt.org_id, minRole: "editor" });

  const admin = createAdminClient();

  // Prepare update data - only include defined fields
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  Object.entries(p.overrides).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = value;
    }
  });

  const { data, error } = await admin
    .from("event_mission_overrides")
    .update(updateData)
    .eq("id", p.missionId)
    .eq("event_id", p.eventId)
    .select("*")
    .single();

  if (error) throw error;

  return {
    ok: true,
    mission: data
  };
}