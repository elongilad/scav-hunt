"use server";
import { z } from "zod";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const Input = z.object({
  eventId: z.string().uuid(),
  eventTeamId: z.string().uuid(),
  eventMissionId: z.string().uuid(),
  eventStationId: z.string().uuid(),
  isRequired: z.boolean().optional()
});

export async function assignTeamMissionToStation(input: z.infer<typeof Input>){
  const p = Input.parse(input);
  const user = await requireAuth();
  const rls = await createServerClient();
  const { data: evt, error } = await rls.from("events").select("id, org_id").eq("id", p.eventId).maybeSingle();
  if(error||!evt) throw error||new Error("Event not found");
  await requireOrgAccess({ userId: user.id, orgId: evt.org_id, minRole: "editor" });

  const admin = createAdminClient();
  const { error: upErr } = await admin.from("event_team_mission_assignments").upsert({
    event_id: p.eventId,
    event_team_id: p.eventTeamId,
    event_mission_id: p.eventMissionId,
    event_station_id: p.eventStationId,
    is_required: p.isRequired ?? true
  }, { onConflict: "event_id,event_team_id,event_mission_id" });
  if (upErr) throw upErr;

  return { ok:true };
}