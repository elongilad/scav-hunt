"use server";
import { z } from "zod";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const Input = z.object({
  eventId: z.string().uuid(),
  simulateParallelHQMissions: z.boolean().default(true),
  estimatePropHandoffTime: z.number().min(60).max(1200).default(300),
  warmupBufferMinutes: z.number().min(0).max(30).default(5),
});

function simulateTeamSchedule(assignments: {eventMissionId: string, eventStationId: string, title?: string}[], travelMatrix: Map<string,number>, missionDurations: Map<string,number>): { order: string[], totalSeconds: number } {
  if (assignments.length === 0) return { order: [], totalSeconds: 0 };
  if (assignments.length === 1) return { order: [assignments[0].eventStationId], totalSeconds: missionDurations.get(assignments[0].eventMissionId) ?? 0 };

  // Simple nearest-neighbor TSP approximation
  const stations = assignments.map(a => a.eventStationId);
  const unvisited = new Set(stations.slice(1));
  let current = stations[0];
  const order = [current];

  while (unvisited.size > 0) {
    let next = null;
    let minTime = Infinity;

    for (const station of unvisited) {
      const time = travelMatrix.get(`${current}->${station}`) ?? 0;
      if (time < minTime) {
        minTime = time;
        next = station;
      }
    }

    if (next) {
      order.push(next);
      unvisited.delete(next);
      current = next;
    } else {
      // Fallback: add remaining stations in order
      unvisited.forEach(s => order.push(s));
      break;
    }
  }

  // Calculate total time (travel + mission durations)
  let totalSeconds = 0;
  for (let i = 0; i < order.length; i++) {
    const station = order[i];
    const assignment = assignments.find(a => a.eventStationId === station);
    if (assignment) {
      totalSeconds += missionDurations.get(assignment.eventMissionId) ?? 0;
    }

    if (i < order.length - 1) {
      const nextStation = order[i + 1];
      totalSeconds += travelMatrix.get(`${station}->${nextStation}`) ?? 0;
    }
  }

  return { order, totalSeconds };
}

export async function simulateEventSchedule(input: z.infer<typeof Input>) {
  const p = Input.parse(input);
  const user = await requireAuth();
  const rls = await createServerClient();

  const { data: evt, error: eErr } = await rls.from("events").select("id, org_id").eq("id", p.eventId).maybeSingle();
  if (eErr || !evt) throw eErr || new Error("Event not found");
  await requireOrgAccess({ userId: user.id, orgId: evt.org_id, minRole: "editor" });

  const admin = createAdminClient();

  // Fetch teams, assignments, travel matrix, and mission durations
  const [
    { data: teams },
    { data: assignments },
    { data: travelData },
    { data: missionOverrides }
  ] = await Promise.all([
    admin.from("event_teams").select("id, name").eq("event_id", p.eventId),
    admin.from("event_team_mission_assignments").select("event_team_id, event_mission_id, event_station_id").eq("event_id", p.eventId),
    admin.from("event_station_travel_times").select("from_station_id, to_station_id, seconds").eq("event_id", p.eventId),
    admin.from("event_mission_overrides").select("id, title, requires_video, requires_photo, requires_actor, prop_requirements").eq("event_id", p.eventId).eq("enabled", true)
  ]);

  if (!teams || teams.length === 0) {
    return { ok: false, error: "No teams found for this event" };
  }

  if (!assignments || assignments.length === 0) {
    return { ok: false, error: "No team assignments found. Please assign missions to stations first." };
  }

  // Build travel matrix
  const travelMatrix = new Map<string, number>();
  if (travelData) {
    travelData.forEach(t => {
      travelMatrix.set(`${t.from_station_id}->${t.to_station_id}`, t.seconds);
    });
  }

  // Build mission duration estimates
  const missionDurations = new Map<string, number>();
  if (missionOverrides) {
    missionOverrides.forEach(m => {
      let duration = 180; // Base 3 minutes
      if (m.requires_video) duration += 600; // +10 min for video
      if (m.requires_photo) duration += 180; // +3 min for photo
      if (m.requires_actor) duration += 300; // +5 min for actor
      if (Array.isArray(m.prop_requirements)) duration += m.prop_requirements.length * 120; // +2 min per prop
      missionDurations.set(m.id, duration);
    });
  }

  // Group assignments by team
  const teamAssignments = new Map<string, Array<{event_mission_id: string, event_station_id: string, title?: string}>>();
  assignments.forEach(a => {
    if (!teamAssignments.has(a.event_team_id)) {
      teamAssignments.set(a.event_team_id, []);
    }
    teamAssignments.get(a.event_team_id)!.push({
      event_mission_id: a.event_mission_id,
      event_station_id: a.event_station_id
    });
  });

  // Simulate schedule for each team
  const schedules = teams.map(team => {
    const teamMissions = (teamAssignments.get(team.id) || []).map(tm => ({
      eventMissionId: tm.event_mission_id,
      eventStationId: tm.event_station_id,
      title: tm.title
    }));
    const schedule = simulateTeamSchedule(teamMissions, travelMatrix, missionDurations);

    return {
      teamId: team.id,
      teamName: team.name,
      stationOrder: schedule.order,
      estimatedDurationMinutes: Math.round(schedule.totalSeconds / 60),
      totalSeconds: schedule.totalSeconds
    };
  });

  return {
    ok: true,
    schedules,
    totalTeams: teams.length,
    averageDurationMinutes: schedules.length > 0 ? Math.round(schedules.reduce((sum, s) => sum + s.estimatedDurationMinutes, 0) / schedules.length) : 0,
    travelMatrixSize: travelMatrix.size,
    assignmentCount: assignments.length
  };
}