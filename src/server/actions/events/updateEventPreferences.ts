"use server";
import { z } from "zod";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const Input = z.object({
  eventId: z.string().uuid(),
  preferences: z.object({
    allow_hq_activities: z.boolean().optional(),
    allow_actor_interactions: z.boolean().optional(),
    prefer_no_video_capture: z.boolean().optional(),
    max_prep_minutes: z.number().int().min(30).max(480).optional()
  })
});

export async function updateEventPreferences(input: z.infer<typeof Input>) {
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

  Object.entries(p.preferences).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = value;
    }
  });

  const { data, error } = await admin
    .from("events")
    .update(updateData)
    .eq("id", p.eventId)
    .select("id, allow_hq_activities, allow_actor_interactions, prefer_no_video_capture, max_prep_minutes")
    .single();

  if (error) throw error;

  return {
    ok: true,
    preferences: data
  };
}