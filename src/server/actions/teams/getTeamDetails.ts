"use server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const Input = z.object({
  eventId: z.string().uuid(),
  teamId: z.string().uuid().optional()
});

export async function getTeamDetails(input: z.infer<typeof Input>) {
  const p = Input.parse(input);
  const user = await requireAuth();
  const supa = await createServerClient();

  const { data: evt, error: eErr } = await supa.from("events").select("id, org_id").eq("id", p.eventId).maybeSingle();
  if (eErr || !evt) throw eErr || new Error("Event not found");
  await requireOrgAccess({ userId: user.id, orgId: evt.org_id, minRole: "viewer" });

  if (p.teamId) {
    // Get specific team details
    const [
      { data: team },
      { data: visits },
      { data: assignments }
    ] = await Promise.all([
      supa.from("event_teams").select("*").eq("id", p.teamId).eq("event_id", p.eventId).single(),
      supa.from("event_team_visits")
        .select(`
          id, event_station_id, visited_at, mission_completed,
          event_stations!inner (
            id, display_name
          )
        `)
        .eq("event_team_id", p.teamId)
        .eq("event_id", p.eventId)
        .order("visited_at", { ascending: true }),
      supa.from("event_team_mission_assignments")
        .select(`
          id, event_station_id, event_mission_id,
          event_stations!inner (
            id, display_name
          ),
          event_mission_overrides!inner (
            id, title
          )
        `)
        .eq("event_team_id", p.teamId)
        .eq("event_id", p.eventId)
    ]);

    if (!team) {
      throw new Error("Team not found");
    }

    // Calculate team statistics
    const completedStations = visits?.filter(v => v.mission_completed).length || 0;
    const totalAssignments = assignments?.length || 0;
    const progressPercent = totalAssignments > 0 ? Math.round((completedStations / totalAssignments) * 100) : 0;

    // Calculate status
    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (visits && visits.length === 0) {
      status = 'not_started';
    } else if (completedStations === totalAssignments && totalAssignments > 0) {
      status = 'completed';
    } else {
      status = 'in_progress';
    }

    // Calculate time
    const startTime = visits && visits.length > 0 ? new Date(visits[0].visited_at) : null;
    const lastVisit = visits && visits.length > 0 ? visits[visits.length - 1] : null;
    const endTime = status === 'completed' && lastVisit ? new Date(lastVisit.visited_at) : null;

    let timeElapsedSeconds = 0;
    if (startTime) {
      const endTimeForCalc = endTime || new Date();
      timeElapsedSeconds = Math.round((endTimeForCalc.getTime() - startTime.getTime()) / 1000);
    }

    return {
      ok: true,
      team: {
        ...team,
        status,
        progressPercent,
        completedStations,
        totalStations: totalAssignments,
        timeElapsedSeconds,
        startTime: startTime?.toISOString() || null,
        endTime: endTime?.toISOString() || null,
        lastActivity: lastVisit?.visited_at || null,
        visits: visits?.map(v => ({
          id: v.id,
          stationId: v.event_station_id,
          stationName: Array.isArray(v.event_stations) ? v.event_stations[0]?.display_name : (v.event_stations as any)?.display_name || 'Unknown Station',
          visitedAt: v.visited_at,
          completed: v.mission_completed
        })) || [],
        assignments: assignments?.map(a => ({
          id: a.id,
          stationId: a.event_station_id,
          stationName: Array.isArray(a.event_stations) ? a.event_stations[0]?.display_name : (a.event_stations as any)?.display_name || 'Unknown Station',
          missionId: a.event_mission_id,
          missionTitle: Array.isArray(a.event_mission_overrides) ? a.event_mission_overrides[0]?.title : (a.event_mission_overrides as any)?.title || 'Unknown Mission'
        })) || []
      }
    };
  } else {
    // Get all teams for the event
    const { data: teams } = await supa
      .from("event_teams")
      .select("*")
      .eq("event_id", p.eventId)
      .order("created_at", { ascending: true });

    return {
      ok: true,
      teams: teams || []
    };
  }
}