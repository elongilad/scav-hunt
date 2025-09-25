"use server";
import { z } from "zod";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const Input = z.object({
  eventId: z.string().uuid(),
  mode: z.enum(["walking", "transit", "driving"]).default("walking"),
  provider: z.enum(["google", "mapbox", "osrm"]).default("osrm"),
  forceRecalculate: z.boolean().default(false),
});

type Station = {
  id: string;
  lat: number;
  lng: number;
  display_name?: string;
};

function haversineMeters(a: {lat: number, lng: number}, b: {lat: number, lng: number}): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s)));
}

async function fetchGoogleDirections(origins: Station[], destinations: Station[], mode: string): Promise<{from: string, to: string, seconds: number, meters: number}[]> {
  // This would require a Google Maps API key
  // For now, return fallback calculations
  const results: {from: string, to: string, seconds: number, meters: number}[] = [];

  for (const origin of origins) {
    for (const destination of destinations) {
      if (origin.id !== destination.id) {
        const meters = haversineMeters(origin, destination);
        // Estimate walking time: ~1.4 m/s average walking speed
        const seconds = Math.round(meters / 1.4);
        results.push({
          from: origin.id,
          to: destination.id,
          seconds,
          meters
        });
      }
    }
  }

  return results;
}

async function fetchOSRMDirections(origins: Station[], destinations: Station[], mode: string): Promise<{from: string, to: string, seconds: number, meters: number}[]> {
  const results: {from: string, to: string, seconds: number, meters: number}[] = [];

  try {
    // Use public OSRM instance for walking directions
    const profile = mode === "driving" ? "driving" : "foot";

    for (const origin of origins) {
      // Batch request for all destinations from this origin
      const coords = destinations
        .filter(d => d.id !== origin.id)
        .map(d => `${d.lng},${d.lat}`)
        .join(';');

      if (coords) {
        const url = `https://router.project-osrm.org/table/v1/${profile}/${origin.lng},${origin.lat};${coords}?sources=0`;

        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();

            if (data.durations && data.distances) {
              destinations.forEach((dest, idx) => {
                if (dest.id !== origin.id) {
                  const duration = data.durations[0][idx + 1]; // +1 because source is at index 0
                  const distance = data.distances[0][idx + 1];

                  if (duration !== null && distance !== null) {
                    results.push({
                      from: origin.id,
                      to: dest.id,
                      seconds: Math.round(duration),
                      meters: Math.round(distance)
                    });
                  }
                }
              });
            }
          }
        } catch (err) {
          console.log(`OSRM request failed for ${origin.id}, falling back to haversine`);
          // Fallback to haversine calculation
          for (const dest of destinations) {
            if (dest.id !== origin.id) {
              const meters = haversineMeters(origin, dest);
              const seconds = Math.round(meters / 1.4); // Walking speed estimate
              results.push({ from: origin.id, to: dest.id, seconds, meters });
            }
          }
        }
      }
    }

    // Add fallback calculations for any missing pairs
    for (const origin of origins) {
      for (const dest of destinations) {
        if (origin.id !== dest.id && !results.find(r => r.from === origin.id && r.to === dest.id)) {
          const meters = haversineMeters(origin, dest);
          const seconds = Math.round(meters / 1.4);
          results.push({ from: origin.id, to: dest.id, seconds, meters });
        }
      }
    }
  } catch (error) {
    console.log("OSRM batch failed, using haversine fallback");
    // Complete fallback to haversine
    for (const origin of origins) {
      for (const dest of destinations) {
        if (origin.id !== dest.id) {
          const meters = haversineMeters(origin, dest);
          const seconds = Math.round(meters / 1.4);
          results.push({ from: origin.id, to: dest.id, seconds, meters });
        }
      }
    }
  }

  return results;
}

export async function buildStationTravelMatrix(input: z.infer<typeof Input>) {
  const p = Input.parse(input);
  const user = await requireAuth();
  const rls = await createServerClient();

  const { data: evt, error: eErr } = await rls.from("events").select("id, org_id").eq("id", p.eventId).maybeSingle();
  if (eErr || !evt) throw eErr || new Error("Event not found");
  await requireOrgAccess({ userId: user.id, orgId: evt.org_id, minRole: "editor" });

  // Get all stations for this event that have coordinates
  const { data: stations, error: sErr } = await rls
    .from("event_stations")
    .select("id, display_name, lat, lng")
    .eq("event_id", p.eventId)
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (sErr) throw sErr;
  if (!stations || stations.length < 2) {
    return { ok: false, message: "Need at least 2 stations with coordinates", stationCount: stations?.length || 0 };
  }

  const admin = createAdminClient();

  // Check if we already have travel times (unless forcing recalculation)
  if (!p.forceRecalculate) {
    const { data: existing } = await admin
      .from("event_station_travel_times")
      .select("from_station_id, to_station_id")
      .eq("event_id", p.eventId)
      .eq("mode", p.mode);

    const expectedPairs = stations.length * (stations.length - 1);
    if (existing && existing.length >= expectedPairs * 0.9) {
      return {
        ok: true,
        message: "Travel matrix already exists",
        stationCount: stations.length,
        pairCount: existing.length,
        skipped: true
      };
    }
  }

  // Fetch travel times using the selected provider
  let travelTimes: {from: string, to: string, seconds: number, meters: number}[];

  switch (p.provider) {
    case "google":
      travelTimes = await fetchGoogleDirections(stations as Station[], stations as Station[], p.mode);
      break;
    case "osrm":
      travelTimes = await fetchOSRMDirections(stations as Station[], stations as Station[], p.mode);
      break;
    default:
      // Fallback to haversine
      travelTimes = [];
      for (const origin of stations) {
        for (const dest of stations) {
          if (origin.id !== dest.id && origin.lat && origin.lng && dest.lat && dest.lng) {
            const meters = haversineMeters(
              { lat: origin.lat, lng: origin.lng },
              { lat: dest.lat, lng: dest.lng }
            );
            const seconds = Math.round(meters / 1.4); // Walking speed estimate
            travelTimes.push({ from: origin.id, to: dest.id, seconds, meters });
          }
        }
      }
  }

  // Save to database
  const travelRecords = travelTimes.map(t => ({
    event_id: p.eventId,
    from_station_id: t.from,
    to_station_id: t.to,
    mode: p.mode,
    seconds: t.seconds,
    meters: t.meters,
    provider: p.provider,
    computed_at: new Date().toISOString()
  }));

  // Delete existing records if force recalculating
  if (p.forceRecalculate) {
    await admin
      .from("event_station_travel_times")
      .delete()
      .eq("event_id", p.eventId)
      .eq("mode", p.mode);
  }

  // Insert new records
  const { error: insertErr } = await admin
    .from("event_station_travel_times")
    .upsert(travelRecords, {
      onConflict: "event_id,from_station_id,to_station_id,mode"
    });

  if (insertErr) throw insertErr;

  return {
    ok: true,
    message: `Travel matrix computed for ${stations.length} stations`,
    stationCount: stations.length,
    pairCount: travelTimes.length,
    provider: p.provider,
    mode: p.mode,
    averageSeconds: Math.round(travelTimes.reduce((sum, t) => sum + t.seconds, 0) / travelTimes.length),
    maxSeconds: Math.max(...travelTimes.map(t => t.seconds))
  };
}