"use server";
import { z } from "zod";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const Input = z.object({
  eventId: z.string().uuid(),
});

export async function generateChecklists(input: z.infer<typeof Input>) {
  const p = Input.parse(input);
  const user = await requireAuth();
  const rls = await createServerClient();
  const admin = createAdminClient();

  const { data: evt, error: eErr } = await rls.from("events").select("id, org_id, starts_at").eq("id", p.eventId).maybeSingle();
  if (eErr || !evt) throw eErr || new Error("Event not found");
  await requireOrgAccess({ userId: user.id, orgId: evt.org_id, minRole: "editor" });

  const [
    { data: missions },
    { data: etma },
    { data: stations }
  ] = await Promise.all([
    rls.from("event_mission_overrides").select("id, enabled, requires_video, requires_photo, prop_requirements, title").eq("event_id", p.eventId),
    rls.from("event_team_mission_assignments").select("event_station_id, event_mission_id").eq("event_id", p.eventId),
    rls.from("event_stations").select("id, display_name").eq("event_id", p.eventId)
  ]);

  const enabled = new Set((missions ?? []).filter(m => m.enabled !== false).map(m => m.id));
  const usedStationIds = new Set((etma ?? []).filter(r => enabled.has(r.event_mission_id)).map(r => r.event_station_id));

  // Upsert checklists for both phases
  const phases = ["pre_event", "day_of"] as const;
  const checklistIds: Record<string, string> = {};

  for (const ph of phases) {
    const { data: checklist } = await admin
      .from("event_checklists")
      .upsert(
        { event_id: p.eventId, phase: ph },
        { onConflict: "event_id,phase" }
      )
      .select("id")
      .maybeSingle();

    if (checklist) {
      checklistIds[ph] = checklist.id;
    }
  }

  // Helper function to upsert tasks
  async function upsertTask(phase: 'pre_event' | 'day_of', taskData: any) {
    const { error } = await admin
      .from("event_checklist_tasks")
      .upsert({
        checklist_id: checklistIds[phase],
        sort_order: 0,
        required: true,
        status: 'todo',
        ...taskData
      });

    if (error) throw error;
  }

  let taskCount = 0;

  try {
    // PRE-EVENT tasks per used station
    for (const sid of usedStationIds) {
      const station = stations?.find(s => s.id === sid);
      const stationName = station?.display_name || 'Station';

      await upsertTask('pre_event', {
        id: `${p.eventId}_pre_${sid}_photo`,
        event_station_id: sid,
        kind: 'capture_photo',
        title: `Wide photo of ${stationName}`,
        description: 'Take a wide establishing shot of the station location'
      });

      await upsertTask('pre_event', {
        id: `${p.eventId}_pre_${sid}_hint`,
        event_station_id: sid,
        kind: 'hint_photo',
        title: `Close-up photo of ${stationName} hiding spot`,
        description: 'Take a detailed photo showing where the QR code will be placed'
      });

      taskCount += 2;
    }

    // PRE-EVENT tasks per enabled mission
    for (const mission of (missions ?? [])) {
      if (!enabled.has(mission.id)) continue;

      const missionName = mission.title || 'Mission';

      if (mission.requires_video) {
        await upsertTask('pre_event', {
          id: `${p.eventId}_pre_${mission.id}_video`,
          event_mission_id: mission.id,
          kind: 'capture_video',
          title: `Capture 10–20s video for ${missionName}`,
          description: 'Record mission explanation video for players'
        });
        taskCount++;
      }

      if (Array.isArray(mission.prop_requirements) && mission.prop_requirements.length > 0) {
        await upsertTask('pre_event', {
          id: `${p.eventId}_pre_${mission.id}_props`,
          event_mission_id: mission.id,
          kind: 'prop_prep',
          title: `Prepare props for ${missionName}`,
          description: `Required props: ${mission.prop_requirements.join(', ')}`
        });
        taskCount++;
      }
    }

    // Generic pre-event tasks
    await upsertTask('pre_event', {
      id: `${p.eventId}_pre_qr_print`,
      kind: 'qr_print',
      title: 'Print all station QR codes',
      description: 'Generate and print QR codes for all stations used in the event'
    });
    taskCount++;

    // DAY-OF tasks per used station
    for (const sid of usedStationIds) {
      const station = stations?.find(s => s.id === sid);
      const stationName = station?.display_name || 'Station';

      await upsertTask('day_of', {
        id: `${p.eventId}_day_${sid}_place`,
        event_station_id: sid,
        kind: 'qr_place',
        title: `Place QR at ${stationName}`,
        description: 'Position QR code at the designated hiding spot'
      });

      await upsertTask('day_of', {
        id: `${p.eventId}_day_${sid}_verify`,
        event_station_id: sid,
        kind: 'verify_scan',
        title: `Test scan at ${stationName}`,
        description: 'Verify QR code can be scanned and leads to correct mission'
      });

      taskCount += 2;
    }

    // Update checklist status to ready
    for (const ph of phases) {
      if (checklistIds[ph]) {
        await admin
          .from("event_checklists")
          .update({ status: 'ready', updated_at: new Date().toISOString() })
          .eq('id', checklistIds[ph]);
      }
    }

    return {
      ok: true,
      preEventChecklistId: checklistIds.pre_event,
      dayOfChecklistId: checklistIds.day_of,
      taskCount,
      stationsCount: usedStationIds.size,
      enabledMissionsCount: enabled.size
    };

  } catch (error) {
    console.error('Failed to generate checklists:', error);
    throw error;
  }
}