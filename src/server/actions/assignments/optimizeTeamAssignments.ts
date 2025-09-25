"use server";
import { z } from "zod";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

// Optimization strategies
type OptimizationStrategy = "balanced" | "shortest_path" | "difficulty_spread" | "time_based";

const Input = z.object({
  eventId: z.string().uuid(),
  strategy: z.enum(["balanced", "shortest_path", "difficulty_spread", "time_based"]).default("balanced"),
  constraints: z.object({
    maxStationsPerTeam: z.number().int().min(1).max(50).optional(),
    minStationsPerTeam: z.number().int().min(1).max(50).optional(),
    prioritizeNewStations: z.boolean().default(true),
    balanceTeamSizes: z.boolean().default(true),
    respectTravelTime: z.boolean().default(true)
  }).optional()
});

interface Station {
  id: string;
  display_name: string;
  latitude?: number;
  longitude?: number;
  difficulty_level?: number;
  estimated_duration?: number;
}

interface Team {
  id: string;
  name: string;
  member_count?: number;
  skill_level?: number;
}

interface Mission {
  id: string;
  station_id: string;
  title: string;
  difficulty_level?: number;
  estimated_minutes?: number;
}

interface TravelTime {
  from_station_id: string;
  to_station_id: string;
  travel_time_minutes: number;
}

interface Assignment {
  teamId: string;
  stationId: string;
  missionId: string;
  sequence: number;
  estimatedStartTime?: Date;
  estimatedEndTime?: Date;
  travelTimeToNext?: number;
}

export async function optimizeTeamAssignments(input: z.infer<typeof Input>) {
  const p = Input.parse(input);
  const user = await requireAuth();
  const rls = await createServerClient();

  // Verify event access
  const { data: evt, error: eErr } = await rls.from("events").select("id, org_id").eq("id", p.eventId).maybeSingle();
  if (eErr || !evt) throw eErr || new Error("Event not found");
  await requireOrgAccess({ userId: user.id, orgId: evt.org_id, minRole: "editor" });

  const admin = createAdminClient();

  // Load all necessary data
  const [
    { data: teams },
    { data: stations },
    { data: missions },
    { data: travelTimes },
    { data: existingAssignments }
  ] = await Promise.all([
    admin.from("event_teams").select("*").eq("event_id", p.eventId),
    admin.from("event_stations").select("*").eq("event_id", p.eventId).eq("enabled", true),
    admin.from("event_mission_overrides").select("*").eq("event_id", p.eventId).eq("enabled", true),
    admin.from("event_travel_times").select("*").eq("event_id", p.eventId),
    admin.from("event_team_mission_assignments").select("*").eq("event_id", p.eventId)
  ]);

  if (!teams || !stations || !missions) {
    throw new Error("Missing required data for optimization");
  }

  // Create optimization engine
  const optimizer = new AssignmentOptimizer(
    teams,
    stations,
    missions,
    travelTimes || [],
    existingAssignments || [],
    p.strategy,
    p.constraints
  );

  // Generate optimized assignments
  const optimizedAssignments = await optimizer.optimize();

  // Clear existing assignments and insert new ones
  await admin.from("event_team_mission_assignments").delete().eq("event_id", p.eventId);

  if (optimizedAssignments.length > 0) {
    const assignmentData = optimizedAssignments.map(assignment => ({
      event_id: p.eventId,
      event_team_id: assignment.teamId,
      event_station_id: assignment.stationId,
      event_mission_id: assignment.missionId,
      sequence_order: assignment.sequence,
      estimated_start_time: assignment.estimatedStartTime?.toISOString(),
      estimated_end_time: assignment.estimatedEndTime?.toISOString(),
      travel_time_minutes: assignment.travelTimeToNext,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: insertError } = await admin
      .from("event_team_mission_assignments")
      .insert(assignmentData);

    if (insertError) throw insertError;
  }

  // Calculate optimization metrics
  const metrics = optimizer.calculateMetrics(optimizedAssignments);

  return {
    ok: true,
    assignments: optimizedAssignments,
    metrics: {
      totalAssignments: optimizedAssignments.length,
      teamsAssigned: new Set(optimizedAssignments.map(a => a.teamId)).size,
      stationsUtilized: new Set(optimizedAssignments.map(a => a.stationId)).size,
      averageStationsPerTeam: optimizedAssignments.length / teams.length,
      totalEstimatedTime: metrics.totalEstimatedTime,
      averageTimePerTeam: metrics.averageTimePerTeam,
      difficultyBalance: metrics.difficultyBalance,
      travelEfficiency: metrics.travelEfficiency
    },
    strategy: p.strategy
  };
}

class AssignmentOptimizer {
  private teams: Team[];
  private stations: Station[];
  private missions: Mission[];
  private travelTimes: Map<string, number>;
  private existingAssignments: Assignment[];
  private strategy: OptimizationStrategy;
  private constraints: any;

  constructor(
    teams: any[],
    stations: any[],
    missions: any[],
    travelTimes: TravelTime[],
    existingAssignments: any[],
    strategy: OptimizationStrategy,
    constraints?: any
  ) {
    this.teams = teams;
    this.stations = stations;
    this.missions = missions;
    this.strategy = strategy;
    this.constraints = constraints || {};

    // Build travel times map
    this.travelTimes = new Map();
    travelTimes.forEach(tt => {
      const key = `${tt.from_station_id}-${tt.to_station_id}`;
      this.travelTimes.set(key, tt.travel_time_minutes);
    });

    // Convert existing assignments
    this.existingAssignments = existingAssignments.map(a => ({
      teamId: a.event_team_id,
      stationId: a.event_station_id,
      missionId: a.event_mission_id,
      sequence: a.sequence_order || 0
    }));
  }

  async optimize(): Promise<Assignment[]> {
    switch (this.strategy) {
      case "balanced":
        return this.balancedOptimization();
      case "shortest_path":
        return this.shortestPathOptimization();
      case "difficulty_spread":
        return this.difficultySpreadOptimization();
      case "time_based":
        return this.timeBasedOptimization();
      default:
        return this.balancedOptimization();
    }
  }

  private balancedOptimization(): Assignment[] {
    const assignments: Assignment[] = [];
    const stationMissionMap = this.groupMissionsByStation();
    const teamAssignmentCounts = new Map<string, number>();

    // Initialize team assignment counts
    this.teams.forEach(team => teamAssignmentCounts.set(team.id, 0));

    // Calculate target assignments per team
    const totalMissions = this.missions.length;
    const targetPerTeam = Math.ceil(totalMissions / this.teams.length);

    // Distribute missions evenly
    const shuffledMissions = [...this.missions].sort(() => Math.random() - 0.5);

    shuffledMissions.forEach((mission, index) => {
      // Find team with least assignments
      const teamId = Array.from(teamAssignmentCounts.entries())
        .sort((a, b) => a[1] - b[1])[0][0];

      const currentCount = teamAssignmentCounts.get(teamId) || 0;
      if (currentCount < targetPerTeam) {
        assignments.push({
          teamId,
          stationId: mission.station_id,
          missionId: mission.id,
          sequence: currentCount + 1
        });
        teamAssignmentCounts.set(teamId, currentCount + 1);
      }
    });

    return this.addTimeEstimates(assignments);
  }

  private shortestPathOptimization(): Assignment[] {
    const assignments: Assignment[] = [];

    // For each team, find optimal path through stations
    this.teams.forEach(team => {
      const teamMissions = this.selectMissionsForTeam(team);
      const optimizedPath = this.findShortestPath(teamMissions);

      optimizedPath.forEach((mission, index) => {
        assignments.push({
          teamId: team.id,
          stationId: mission.station_id,
          missionId: mission.id,
          sequence: index + 1
        });
      });
    });

    return this.addTimeEstimates(assignments);
  }

  private difficultySpreadOptimization(): Assignment[] {
    const assignments: Assignment[] = [];

    // Sort missions by difficulty
    const missionsByDifficulty = [...this.missions].sort((a, b) =>
      (a.difficulty_level || 1) - (b.difficulty_level || 1)
    );

    // Distribute missions to balance difficulty across teams
    this.teams.forEach((team, teamIndex) => {
      const teamMissions = missionsByDifficulty.filter((_, index) =>
        index % this.teams.length === teamIndex
      );

      teamMissions.forEach((mission, sequence) => {
        assignments.push({
          teamId: team.id,
          stationId: mission.station_id,
          missionId: mission.id,
          sequence: sequence + 1
        });
      });
    });

    return this.addTimeEstimates(assignments);
  }

  private timeBasedOptimization(): Assignment[] {
    const assignments: Assignment[] = [];
    const eventStartTime = new Date();

    // Schedule missions with time constraints
    this.teams.forEach(team => {
      const teamMissions = this.selectMissionsForTeam(team);
      let currentTime = new Date(eventStartTime);

      teamMissions.forEach((mission, sequence) => {
        const estimatedDuration = mission.estimated_minutes || 15;
        const estimatedEndTime = new Date(currentTime.getTime() + estimatedDuration * 60000);

        assignments.push({
          teamId: team.id,
          stationId: mission.station_id,
          missionId: mission.id,
          sequence: sequence + 1,
          estimatedStartTime: new Date(currentTime),
          estimatedEndTime: estimatedEndTime
        });

        // Add travel time to next station
        const nextMission = teamMissions[sequence + 1];
        if (nextMission) {
          const travelTime = this.getTravelTime(mission.station_id, nextMission.station_id);
          currentTime = new Date(estimatedEndTime.getTime() + travelTime * 60000);
        }
      });
    });

    return assignments;
  }

  private selectMissionsForTeam(team: Team): Mission[] {
    // Simple selection - can be enhanced with team skill level, preferences, etc.
    const missionsPerTeam = Math.ceil(this.missions.length / this.teams.length);
    const startIndex = this.teams.indexOf(team) * missionsPerTeam;
    return this.missions.slice(startIndex, startIndex + missionsPerTeam);
  }

  private findShortestPath(missions: Mission[]): Mission[] {
    if (missions.length <= 1) return missions;

    // Simple nearest-neighbor approach
    const path: Mission[] = [missions[0]];
    const remaining = missions.slice(1);

    while (remaining.length > 0) {
      const current = path[path.length - 1];
      let nearestIndex = 0;
      let shortestDistance = Infinity;

      remaining.forEach((mission, index) => {
        const distance = this.getTravelTime(current.station_id, mission.station_id);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestIndex = index;
        }
      });

      path.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    return path;
  }

  private getTravelTime(fromStationId: string, toStationId: string): number {
    const key = `${fromStationId}-${toStationId}`;
    return this.travelTimes.get(key) || 5; // Default 5 minutes
  }

  private addTimeEstimates(assignments: Assignment[]): Assignment[] {
    const eventStartTime = new Date();
    const teamCurrentTimes = new Map<string, Date>();

    // Initialize team start times
    this.teams.forEach(team => {
      teamCurrentTimes.set(team.id, new Date(eventStartTime));
    });

    return assignments.map(assignment => {
      const currentTime = teamCurrentTimes.get(assignment.teamId) || new Date(eventStartTime);
      const mission = this.missions.find(m => m.id === assignment.missionId);
      const duration = mission?.estimated_minutes || 15;

      const estimatedStartTime = new Date(currentTime);
      const estimatedEndTime = new Date(currentTime.getTime() + duration * 60000);

      // Update team's current time
      teamCurrentTimes.set(assignment.teamId, estimatedEndTime);

      return {
        ...assignment,
        estimatedStartTime,
        estimatedEndTime
      };
    });
  }

  private groupMissionsByStation(): Map<string, Mission[]> {
    const map = new Map<string, Mission[]>();
    this.missions.forEach(mission => {
      if (!map.has(mission.station_id)) {
        map.set(mission.station_id, []);
      }
      map.get(mission.station_id)!.push(mission);
    });
    return map;
  }

  calculateMetrics(assignments: Assignment[]): any {
    const teamTimes = new Map<string, number>();
    let totalTime = 0;

    assignments.forEach(assignment => {
      if (assignment.estimatedStartTime && assignment.estimatedEndTime) {
        const duration = assignment.estimatedEndTime.getTime() - assignment.estimatedStartTime.getTime();
        const teamId = assignment.teamId;
        teamTimes.set(teamId, (teamTimes.get(teamId) || 0) + duration);
        totalTime += duration;
      }
    });

    const averageTimePerTeam = teamTimes.size > 0 ? totalTime / teamTimes.size : 0;

    // Calculate difficulty balance (standard deviation of difficulty across teams)
    const teamDifficulties = new Map<string, number[]>();
    assignments.forEach(assignment => {
      const mission = this.missions.find(m => m.id === assignment.missionId);
      const difficulty = mission?.difficulty_level || 1;

      if (!teamDifficulties.has(assignment.teamId)) {
        teamDifficulties.set(assignment.teamId, []);
      }
      teamDifficulties.get(assignment.teamId)!.push(difficulty);
    });

    const teamAvgDifficulties = Array.from(teamDifficulties.values()).map(difficulties =>
      difficulties.reduce((sum, diff) => sum + diff, 0) / difficulties.length
    );

    const avgDifficulty = teamAvgDifficulties.reduce((sum, diff) => sum + diff, 0) / teamAvgDifficulties.length;
    const difficultyVariance = teamAvgDifficulties.reduce((sum, diff) => sum + Math.pow(diff - avgDifficulty, 2), 0) / teamAvgDifficulties.length;
    const difficultyBalance = 1 / (1 + Math.sqrt(difficultyVariance)); // Higher is better

    return {
      totalEstimatedTime: totalTime / (1000 * 60), // Convert to minutes
      averageTimePerTeam: averageTimePerTeam / (1000 * 60),
      difficultyBalance,
      travelEfficiency: 0.8 // Placeholder - could calculate actual efficiency
    };
  }
}