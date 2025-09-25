"use server";
import { z } from "zod";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const Input = z.object({
  eventId: z.string().uuid(),
  teamId: z.string().uuid(),
  updates: z.object({
    name: z.string().min(1).max(100).optional(),
    color: z.string().optional(),
    emblemUrl: z.string().url().optional().or(z.literal("")),
    maxMembers: z.number().int().min(1).max(50).optional(),
    status: z.enum(["active", "inactive", "completed"]).optional()
  })
});

export async function updateTeam(input: z.infer<typeof Input>) {
  const p = Input.parse(input);
  const user = await requireAuth();
  const rls = await createServerClient();

  const { data: evt, error: eErr } = await rls.from("events").select("id, org_id").eq("id", p.eventId).maybeSingle();
  if (eErr || !evt) throw eErr || new Error("Event not found");
  await requireOrgAccess({ userId: user.id, orgId: evt.org_id, minRole: "editor" });

  const admin = createAdminClient();

  // Prepare update data
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  Object.entries(p.updates).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === "emblemUrl") {
        updateData["emblem_url"] = value === "" ? null : value;
      } else if (key === "maxMembers") {
        updateData["max_members"] = value;
      } else {
        updateData[key] = value;
      }
    }
  });

  const { data, error } = await admin
    .from("event_teams")
    .update(updateData)
    .eq("id", p.teamId)
    .eq("event_id", p.eventId)
    .select("*")
    .single();

  if (error) throw error;

  return {
    ok: true,
    team: data
  };
}