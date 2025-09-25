"use server";
import { z } from "zod";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const Input = z.object({
  eventId: z.string().uuid(),
  routingStrategy: z.enum(["optimal_time", "balanced_difficulty", "scenic_route", "shortest_distance"]).default("optimal_time"),
  constraints: z.object({
    maxRouteTime: z.number().int().min(30).max(480).optional(), // minutes
    avoidCrowdedStations: z.boolean().default(true),
    prioritizeOutdoorStations: z.boolean().default(false),
    includeRestStops: z.boolean().default(true),
    teamSkillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional()
  }).optional()
});

interface Station {
  id: string;
  display_name: string;
  latitude?: number;
  longitude?: number;
  difficulty_level?: number;
  estimated_duration?: number;
  station_type?: string;
  capacity?: number;
}

interface Assignment {
  team_id: string;
  station_id: string;
  mission_id: string;
  sequence_order: number;
}

interface RouteSegment {
  fromStationId: string;
  toStationId: string;
  distance: number;
  estimatedTime: number;
  transportMode: "walking" | "driving" | "public_transport";
  waypoints?: Array<{ lat: number; lng: number; description?: string }>;
  instructions?: string[];
}

interface TeamRoute {
  teamId: string;
  teamName: string;
  totalDistance: number;
  totalTime: number;
  difficulty: number;
  segments: RouteSegment[];
  stations: Array<{
    stationId: string;
    stationName: string;
    arrivalTime: Date;
    departureTime: Date;
    missionId: string;
    missionTitle: string;
    estimatedDuration: number;
    sequence: number;
  }>;
  alternativeRoutes?: TeamRoute[];
  optimizationScore: number;
}

export async function generateOptimalRoutes(input: z.infer<typeof Input>) {
  const p = Input.parse(input);
  const user = await requireAuth();
  const rls = await createServerClient();

  // Verify event access
  const { data: evt, error: eErr } = await rls.from("events").select("id, org_id, starts_at").eq("id", p.eventId).maybeSingle();
  if (eErr || !evt) throw eErr || new Error("Event not found");
  await requireOrgAccess({ userId: user.id, orgId: evt.org_id, minRole: "editor" });

  const admin = createAdminClient();

  // Load routing data
  const [
    { data: teams },
    { data: stations },
    { data: assignments },
    { data: missions },
    { data: travelTimes }
  ] = await Promise.all([
    admin.from("event_teams").select("*").eq("event_id", p.eventId),
    admin.from("event_stations").select("*").eq("event_id", p.eventId).eq("enabled", true),
    admin.from("event_team_mission_assignments").select("*").eq("event_id", p.eventId),
    admin.from("event_mission_overrides").select("*").eq("event_id", p.eventId).eq("enabled", true),
    admin.from("event_travel_times").select("*").eq("event_id", p.eventId)
  ]);

  if (!teams || !stations || !assignments || !missions) {
    throw new Error("Missing required data for route generation");
  }

  // Create routing engine
  const router = new RouteOptimizer(
    teams,
    stations,
    assignments,
    missions,
    travelTimes || [],
    p.routingStrategy,
    p.constraints,
    evt.starts_at
  );

  // Generate optimized routes for all teams
  const teamRoutes = await router.generateAllRoutes();

  // Store routes in database
  await router.saveRoutes(admin, p.eventId, teamRoutes);

  // Calculate route analytics
  const analytics = router.calculateRouteAnalytics(teamRoutes);

  return {
    ok: true,
    routes: teamRoutes,
    analytics,
    strategy: p.routingStrategy,
    totalTeamsRouted: teamRoutes.length
  };
}

class RouteOptimizer {
  private teams: any[];
  private stations: Station[];
  private assignments: Assignment[];
  private missions: any[];
  private travelTimes: Map<string, number>;
  private strategy: string;
  private constraints: any;
  private eventStartTime: Date;

  constructor(
    teams: any[],
    stations: any[],
    assignments: any[],
    missions: any[],
    travelTimes: any[],
    strategy: string,
    constraints: any,
    eventStartTime: string
  ) {
    this.teams = teams;
    this.stations = stations;
    this.assignments = assignments;
    this.missions = missions;
    this.strategy = strategy;
    this.constraints = constraints || {};
    this.eventStartTime = new Date(eventStartTime);

    // Build travel times map
    this.travelTimes = new Map();
    travelTimes.forEach(tt => {
      const key = `${tt.from_station_id}-${tt.to_station_id}`;
      this.travelTimes.set(key, tt.travel_time_minutes);
    });
  }

  async generateAllRoutes(): Promise<TeamRoute[]> {
    const routes: TeamRoute[] = [];

    for (const team of this.teams) {
      const teamAssignments = this.assignments.filter(a => a.team_id === team.id);
      if (teamAssignments.length === 0) continue;

      const route = await this.generateTeamRoute(team, teamAssignments);
      if (route) {
        routes.push(route);
      }
    }

    return routes;
  }

  private async generateTeamRoute(team: any, assignments: Assignment[]): Promise<TeamRoute | null> {
    // Sort assignments by sequence
    const sortedAssignments = assignments.sort((a, b) => a.sequence_order - b.sequence_order);

    // Get station details for each assignment
    const stationDetails = sortedAssignments.map(assignment => {
      const station = this.stations.find(s => s.id === assignment.station_id);
      const mission = this.missions.find(m => m.id === assignment.mission_id);
      return {
        assignment,
        station,
        mission,
        estimatedDuration: mission?.estimated_minutes || 15
      };
    });

    // Apply routing strategy
    const optimizedOrder = await this.optimizeStationOrder(stationDetails);

    // Generate route segments
    const segments: RouteSegment[] = [];
    let currentTime = new Date(this.eventStartTime);
    let totalDistance = 0;
    let totalTime = 0;

    const routeStations = [];

    for (let i = 0; i < optimizedOrder.length; i++) {
      const current = optimizedOrder[i];
      const next = optimizedOrder[i + 1];

      // Add station visit
      const arrivalTime = new Date(currentTime);
      const departureTime = new Date(currentTime.getTime() + current.estimatedDuration * 60000);

      routeStations.push({
        stationId: current.station.id,
        stationName: current.station.display_name || 'Unknown Station',
        arrivalTime,
        departureTime,
        missionId: current.mission.id,
        missionTitle: current.mission.title || 'Unknown Mission',
        estimatedDuration: current.estimatedDuration,
        sequence: i + 1
      });

      // Add travel segment to next station
      if (next) {
        const travelTime = this.getTravelTime(current.station.id, next.station.id);
        const distance = this.estimateDistance(current.station, next.station);

        segments.push({
          fromStationId: current.station.id,
          toStationId: next.station.id,
          distance,
          estimatedTime: travelTime,
          transportMode: this.determineTransportMode(distance, travelTime),
          instructions: await this.generateDirections(current.station, next.station)
        });

        totalDistance += distance;
        totalTime += travelTime;
        currentTime = new Date(departureTime.getTime() + travelTime * 60000);
      }

      totalTime += current.estimatedDuration;
    }

    // Calculate difficulty and optimization score
    const avgDifficulty = stationDetails.reduce((sum, detail) =>
      sum + (detail.station?.difficulty_level || 1), 0) / stationDetails.length;

    const optimizationScore = this.calculateOptimizationScore(
      totalTime, totalDistance, avgDifficulty, segments.length
    );

    return {
      teamId: team.id,
      teamName: team.name || `Team ${team.id.slice(0, 6)}`,
      totalDistance,
      totalTime,
      difficulty: avgDifficulty,
      segments,
      stations: routeStations,
      optimizationScore
    };
  }

  private async optimizeStationOrder(stationDetails: any[]): Promise<any[]> {
    switch (this.strategy) {
      case "optimal_time":
        return this.optimizeForTime(stationDetails);
      case "balanced_difficulty":
        return this.optimizeForDifficulty(stationDetails);
      case "scenic_route":
        return this.optimizeForScenery(stationDetails);
      case "shortest_distance":
        return this.optimizeForDistance(stationDetails);
      default:
        return stationDetails;
    }
  }

  private optimizeForTime(stations: any[]): any[] {
    // Use nearest neighbor algorithm for time optimization
    if (stations.length <= 1) return stations;

    const optimized = [stations[0]];
    const remaining = stations.slice(1);

    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      let nearestIndex = 0;
      let shortestTime = Infinity;

      remaining.forEach((station, index) => {
        const travelTime = this.getTravelTime(current.station.id, station.station.id);
        if (travelTime < shortestTime) {
          shortestTime = travelTime;
          nearestIndex = index;
        }
      });

      optimized.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    return optimized;
  }

  private optimizeForDifficulty(stations: any[]): any[] {
    // Sort by difficulty for balanced progression
    return stations.sort((a, b) => {
      const diffA = a.station.difficulty_level || 1;
      const diffB = b.station.difficulty_level || 1;
      return diffA - diffB;
    });
  }

  private optimizeForScenery(stations: any[]): any[] {
    // Prioritize outdoor stations and interesting locations
    return stations.sort((a, b) => {
      const scoreA = this.getSceneryScore(a.station);
      const scoreB = this.getSceneryScore(b.station);
      return scoreB - scoreA;
    });
  }

  private optimizeForDistance(stations: any[]): any[] {
    // Use traveling salesman approach for shortest distance
    return this.optimizeForTime(stations); // Simplified - same as time for now
  }

  private getSceneryScore(station: Station): number {
    let score = 0;
    if (station.station_type?.includes('outdoor')) score += 3;
    if (station.station_type?.includes('landmark')) score += 2;
    if (station.station_type?.includes('park')) score += 2;
    if (station.station_type?.includes('museum')) score += 1;
    return score;
  }

  private getTravelTime(fromStationId: string, toStationId: string): number {
    const key = `${fromStationId}-${toStationId}`;
    return this.travelTimes.get(key) || this.estimateTravelTime(fromStationId, toStationId);
  }

  private estimateTravelTime(fromStationId: string, toStationId: string): number {
    const fromStation = this.stations.find(s => s.id === fromStationId);
    const toStation = this.stations.find(s => s.id === toStationId);

    if (!fromStation || !toStation || !fromStation.latitude || !toStation.latitude) {
      return 10; // Default 10 minutes
    }

    const distance = this.calculateHaversineDistance(
      fromStation.latitude, fromStation.longitude || 0,
      toStation.latitude, toStation.longitude || 0
    );

    // Assume walking speed of 5 km/h
    return Math.round((distance / 5) * 60);
  }

  private estimateDistance(fromStation: Station, toStation: Station): number {
    if (!fromStation.latitude || !toStation.latitude) {
      return 1000; // Default 1km
    }

    return this.calculateHaversineDistance(
      fromStation.latitude, fromStation.longitude || 0,
      toStation.latitude, toStation.longitude || 0
    ) * 1000; // Convert to meters
  }

  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private determineTransportMode(distance: number, travelTime: number): "walking" | "driving" | "public_transport" {
    if (distance < 500) return "walking"; // Less than 500m - walk
    if (distance < 2000) return "walking"; // Less than 2km - still walkable
    if (travelTime > 30) return "public_transport"; // Long time suggests public transport
    return "driving";
  }

  private async generateDirections(fromStation: Station, toStation: Station): Promise<string[]> {
    // Simplified direction generation - in production, integrate with mapping service
    const directions = [
      `Head from ${fromStation.display_name} to ${toStation.display_name}`,
      `Estimated travel time: ${this.getTravelTime(fromStation.id, toStation.id)} minutes`
    ];

    if (fromStation.latitude && toStation.latitude) {
      const bearing = this.calculateBearing(
        fromStation.latitude, fromStation.longitude || 0,
        toStation.latitude, toStation.longitude || 0
      );
      directions.unshift(`Head ${this.bearingToDirection(bearing)}`);
    }

    return directions;
  }

  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = this.toRadians(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(this.toRadians(lat2));
    const x = Math.cos(this.toRadians(lat1)) * Math.sin(this.toRadians(lat2)) -
              Math.sin(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.cos(dLon);

    return (this.toDegrees(Math.atan2(y, x)) + 360) % 360;
  }

  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  private bearingToDirection(bearing: number): string {
    const directions = ["North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest"];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  private calculateOptimizationScore(
    totalTime: number,
    totalDistance: number,
    avgDifficulty: number,
    segmentCount: number
  ): number {
    // Higher score is better
    let score = 100;

    // Penalize excessive time
    if (totalTime > 240) score -= 20; // Over 4 hours
    if (totalTime > 360) score -= 30; // Over 6 hours

    // Reward efficient routing (fewer segments for same stations)
    score += Math.max(0, 20 - segmentCount);

    // Balance difficulty
    if (avgDifficulty > 1 && avgDifficulty < 4) score += 10;

    // Reward reasonable distance
    if (totalDistance < 5000) score += 10; // Under 5km total

    return Math.max(0, Math.min(100, score));
  }

  async saveRoutes(admin: any, eventId: string, routes: TeamRoute[]): Promise<void> {
    // Clear existing routes
    await admin.from("event_team_routes").delete().eq("event_id", eventId);

    // Insert new routes
    const routeData = routes.map(route => ({
      event_id: eventId,
      team_id: route.teamId,
      route_data: JSON.stringify({
        segments: route.segments,
        stations: route.stations,
        totalDistance: route.totalDistance,
        totalTime: route.totalTime,
        difficulty: route.difficulty,
        optimizationScore: route.optimizationScore
      }),
      total_distance: route.totalDistance,
      total_time_minutes: route.totalTime,
      optimization_score: route.optimizationScore,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    if (routeData.length > 0) {
      const { error } = await admin.from("event_team_routes").insert(routeData);
      if (error) throw error;
    }
  }

  calculateRouteAnalytics(routes: TeamRoute[]): any {
    if (routes.length === 0) {
      return {
        totalRoutes: 0,
        averageTime: 0,
        averageDistance: 0,
        averageOptimizationScore: 0,
        difficultyDistribution: {},
        transportModeBreakdown: {}
      };
    }

    const totalTime = routes.reduce((sum, r) => sum + r.totalTime, 0);
    const totalDistance = routes.reduce((sum, r) => sum + r.totalDistance, 0);
    const totalScore = routes.reduce((sum, r) => sum + r.optimizationScore, 0);

    // Analyze transport modes
    const transportModes: Record<string, number> = {};
    routes.forEach(route => {
      route.segments.forEach(segment => {
        transportModes[segment.transportMode] = (transportModes[segment.transportMode] || 0) + 1;
      });
    });

    // Analyze difficulty distribution
    const difficultyBins = { easy: 0, medium: 0, hard: 0, expert: 0 };
    routes.forEach(route => {
      if (route.difficulty <= 1.5) difficultyBins.easy++;
      else if (route.difficulty <= 2.5) difficultyBins.medium++;
      else if (route.difficulty <= 3.5) difficultyBins.hard++;
      else difficultyBins.expert++;
    });

    return {
      totalRoutes: routes.length,
      averageTime: Math.round(totalTime / routes.length),
      averageDistance: Math.round(totalDistance / routes.length),
      averageOptimizationScore: Math.round(totalScore / routes.length),
      difficultyDistribution: difficultyBins,
      transportModeBreakdown: transportModes,
      longestRoute: Math.max(...routes.map(r => r.totalTime)),
      shortestRoute: Math.min(...routes.map(r => r.totalTime)),
      mostOptimizedScore: Math.max(...routes.map(r => r.optimizationScore)),
      leastOptimizedScore: Math.min(...routes.map(r => r.optimizationScore))
    };
  }
}