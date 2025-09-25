"use server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const Input = z.object({
  eventId: z.string().uuid(),
});

export async function buildSetupRoute(input: z.infer<typeof Input>) {
  const p = Input.parse(input);
  const user = await requireAuth();
  const supa = await createServerClient();

  const { data: evt, error: eErr } = await supa.from("events").select("id, org_id").eq("id", p.eventId).maybeSingle();
  if (eErr || !evt) throw eErr || new Error("Event not found");
  await requireOrgAccess({ userId: user.id, orgId: evt.org_id, minRole: "editor" });

  // Get day-of checklist ID
  const { data: dayOfChecklist } = await supa
    .from("event_checklists")
    .select("id")
    .eq("event_id", p.eventId)
    .eq("phase", "day_of")
    .maybeSingle();

  if (!dayOfChecklist) {
    return { ok: false, error: "Day-of checklist not found. Generate checklists first." };
  }

  const [
    { data: tasks },
    { data: tt },
    { data: stations }
  ] = await Promise.all([
    supa
      .from("event_checklist_tasks")
      .select("event_station_id, title")
      .eq("checklist_id", dayOfChecklist.id)
      .eq("kind", "qr_place")
      .eq("status", "todo"),
    supa
      .from("event_station_travel_times")
      .select("from_station_id, to_station_id, seconds")
      .eq("event_id", p.eventId),
    supa
      .from("event_stations")
      .select("id, display_name, lat, lng")
      .eq("event_id", p.eventId)
  ]);

  // Get unique station IDs that need QR placement
  const stationIds = Array.from(
    new Set((tasks ?? []).map(t => t.event_station_id).filter(Boolean))
  ) as string[];

  // Build travel time map
  const travelMap = new Map<string, number>();
  (tt ?? []).forEach(t => {
    travelMap.set(`${t.from_station_id}->${t.to_station_id}`, t.seconds);
  });

  if (stationIds.length <= 1) {
    return {
      ok: true,
      order: stationIds,
      totalSeconds: 0,
      totalMinutes: 0,
      stationCount: stationIds.length
    };
  }

  // Nearest neighbor TSP approximation
  const remaining = new Set(stationIds);
  const order: string[] = [];
  let current = stationIds[0]; // Start with first station
  order.push(current);
  remaining.delete(current);

  while (remaining.size > 0) {
    let bestNext: string | undefined;
    let bestTime = Infinity;

    for (const stationId of remaining) {
      const travelTime = travelMap.get(`${current}->${stationId}`) ?? 0;
      if (travelTime < bestTime) {
        bestTime = travelTime;
        bestNext = stationId;
      }
    }

    if (bestNext) {
      current = bestNext;
      order.push(current);
      remaining.delete(current);
    } else {
      // No travel time data, just add remaining stations in order
      remaining.forEach(s => order.push(s));
      break;
    }
  }

  // 2-opt improvement
  function getSegmentTime(fromIdx: number, toIdx: number): number {
    if (fromIdx >= order.length || toIdx >= order.length) return 0;
    return travelMap.get(`${order[fromIdx]}->${order[toIdx]}`) ?? 0;
  }

  let improved = true;
  let iterations = 0;
  const maxIterations = 100; // Prevent infinite loops

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 1; i < order.length - 2; i++) {
      for (let k = i + 1; k < order.length - 1; k++) {
        // Calculate current segment costs
        const currentCost = getSegmentTime(i - 1, i) + getSegmentTime(k, k + 1);
        // Calculate cost after reversing segment
        const newCost = getSegmentTime(i - 1, k) + getSegmentTime(i, k + 1);

        const improvement = currentCost - newCost;

        if (improvement > 1) { // Only improve if save more than 1 second
          // Reverse the segment from i to k
          const segment = order.slice(i, k + 1);
          segment.reverse();
          order.splice(i, k - i + 1, ...segment);
          improved = true;
        }
      }
    }
  }

  // Calculate total time
  let totalSeconds = 0;
  for (let i = 0; i < order.length - 1; i++) {
    totalSeconds += travelMap.get(`${order[i]}->${order[i + 1]}`) ?? 0;
  }

  // Add station display names for UI
  const stationMap = new Map((stations ?? []).map(s => [s.id, s]));
  const routeWithNames = order.map(id => ({
    stationId: id,
    displayName: stationMap.get(id)?.display_name || 'Unknown Station',
    coordinates: stationMap.get(id)?.lat && stationMap.get(id)?.lng ? {
      lat: stationMap.get(id)!.lat!,
      lng: stationMap.get(id)!.lng!
    } : null
  }));

  return {
    ok: true,
    order: order,
    route: routeWithNames,
    totalSeconds,
    totalMinutes: Math.round(totalSeconds / 60),
    stationCount: order.length,
    optimizationIterations: iterations,
    hasTravelData: travelMap.size > 0
  };
}