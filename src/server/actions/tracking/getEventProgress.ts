"use server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const Input = z.object({
  eventId: z.string().uuid(),
});

export async function getEventProgress(input: z.infer<typeof Input>) {
  const p = Input.parse(input);
  const user = await requireAuth();
  const supa = await createServerClient();

  const { data: evt, error: eErr } = await supa.from("events").select("id, org_id, starts_at, child_name").eq("id", p.eventId).maybeSingle();
  if (eErr || !evt) throw eErr || new Error("Event not found");
  await requireOrgAccess({ userId: user.id, orgId: evt.org_id, minRole: "viewer" });

  // Get teams with their current progress
  const [
    { data: teams },
    { data: visits },
    { data: assignments },
    { data: stations },
    { data: missions }
  ] = await Promise.all([
    supa.from("event_teams").select("id, name, created_at").eq("event_id", p.eventId),
    supa.from("event_team_visits")
      .select("event_team_id, event_station_id, visited_at, mission_completed")
      .eq("event_id", p.eventId)
      .order("visited_at", { ascending: true }),
    supa.from("event_team_mission_assignments")
      .select("event_team_id, event_mission_id, event_station_id")
      .eq("event_id", p.eventId),
    supa.from("event_stations")
      .select("id, display_name")
      .eq("event_id", p.eventId),
    supa.from("event_mission_overrides")
      .select("id, title, enabled")
      .eq("event_id", p.eventId)
      .eq("enabled", true)
  ]);

  if (!teams || teams.length === 0) {
    return {
      ok: true,
      event: evt,
      teams: [],
      totalStations: stations?.length || 0,
      totalMissions: missions?.length || 0,
      eventStarted: false,
      lastUpdate: new Date().toISOString()
    };
  }

  // Create lookup maps
  const stationMap = new Map((stations || []).map(s => [s.id, s]));
  const missionMap = new Map((missions || []).map(m => [m.id, m]));

  // Group visits by team
  const teamVisits = new Map<string, any[]>();
  (visits || []).forEach(visit => {
    if (!teamVisits.has(visit.event_team_id)) {
      teamVisits.set(visit.event_team_id, []);
    }
    teamVisits.get(visit.event_team_id)!.push(visit);
  });

  // Group assignments by team
  const teamAssignments = new Map<string, any[]>();
  (assignments || []).forEach(assignment => {
    if (!teamAssignments.has(assignment.event_team_id)) {
      teamAssignments.set(assignment.event_team_id, []);
    }
    teamAssignments.get(assignment.event_team_id)!.push(assignment);
  });

  // Calculate progress for each team
  const teamProgress = teams.map(team => {
    const visits = teamVisits.get(team.id) || [];
    const assignments = teamAssignments.get(team.id) || [];

    const completedStations = visits.filter(v => v.mission_completed).length;
    const totalAssignments = assignments.length;
    const progressPercent = totalAssignments > 0 ? Math.round((completedStations / totalAssignments) * 100) : 0;

    // Find current/last station
    const lastVisit = visits[visits.length - 1];
    const currentStation = lastVisit ? stationMap.get(lastVisit.event_station_id) : null;

    // Calculate status
    let status = 'not_started';
    if (visits.length === 0) {
      status = 'not_started';
    } else if (completedStations === totalAssignments && totalAssignments > 0) {
      status = 'completed';
    } else {
      status = 'in_progress';
    }

    // Calculate time elapsed
    const startTime = visits.length > 0 ? new Date(visits[0].visited_at) : null;
    const endTime = status === 'completed' && lastVisit ? new Date(lastVisit.visited_at) : null;
    const currentTime = new Date();

    let timeElapsed = 0;
    if (startTime) {
      const endTimeForCalc = endTime || currentTime;
      timeElapsed = Math.round((endTimeForCalc.getTime() - startTime.getTime()) / 1000);
    }

    return {
      teamId: team.id,
      teamName: team.name || `Team ${team.id.slice(0, 6)}`,
      status,
      completedStations,
      totalStations: totalAssignments,
      progressPercent,
      currentStation: currentStation ? {
        id: currentStation.id,
        name: currentStation.display_name || 'Unknown Station'
      } : null,
      startTime: startTime?.toISOString() || null,
      endTime: endTime?.toISOString() || null,
      timeElapsedSeconds: timeElapsed,
      lastActivity: lastVisit?.visited_at || null,
      visits: visits.map(v => ({
        stationId: v.event_station_id,
        stationName: stationMap.get(v.event_station_id)?.display_name || 'Unknown',
        visitedAt: v.visited_at,
        completed: v.mission_completed
      }))
    };
  });

  // Sort teams by progress (completed first, then by progress percentage, then by time)
  teamProgress.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return -1;
    if (b.status === 'completed' && a.status !== 'completed') return 1;
    if (a.status === 'completed' && b.status === 'completed') {
      return a.timeElapsedSeconds - b.timeElapsedSeconds; // Faster completion first
    }
    return b.progressPercent - a.progressPercent; // Higher progress first
  });

  // Calculate event-level stats
  const totalTeams = teams.length;
  const teamsStarted = teamProgress.filter(t => t.status !== 'not_started').length;
  const teamsCompleted = teamProgress.filter(t => t.status === 'completed').length;
  const teamsInProgress = teamProgress.filter(t => t.status === 'in_progress').length;
  const averageProgress = teamProgress.reduce((sum, t) => sum + t.progressPercent, 0) / totalTeams;

  return {
    ok: true,
    event: {
      id: evt.id,
      name: evt.child_name,
      startsAt: evt.starts_at,
      orgId: evt.org_id
    },
    teams: teamProgress,
    stats: {
      totalTeams,
      teamsStarted,
      teamsCompleted,
      teamsInProgress,
      averageProgress: Math.round(averageProgress),
      completionRate: totalTeams > 0 ? Math.round((teamsCompleted / totalTeams) * 100) : 0
    },
    totalStations: stations?.length || 0,
    totalMissions: missions?.length || 0,
    eventStarted: teamsStarted > 0,
    lastUpdate: new Date().toISOString()
  };
}