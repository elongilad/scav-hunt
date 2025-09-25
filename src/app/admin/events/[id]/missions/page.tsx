import { requireAuth } from "@/lib/auth/requireAuth";
import { createServerClient } from "@/lib/supabase/server";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { MissionPreferencesClient } from "./components/MissionPreferencesClient";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MissionsPage({ params }: PageProps) {
  const { id } = await params;
  await requireAuth();
  const supa = await createServerClient();

  const [{ data: event }, { data: prefs }, { data: missions }] = await Promise.all([
    supa.from("events").select("id, child_name").eq("id", id).single(),
    supa.from("events").select("allow_hq_activities, allow_actor_interactions, prefer_no_video_capture, max_prep_minutes").eq("id", id).maybeSingle(),
    supa.from("event_mission_overrides").select("id, title, enabled, requires_video, requires_photo, requires_actor, hq_candidate, activity_candidate, prop_requirements, expected_minutes, p95_minutes").eq("event_id", id)
  ]);

  const preferences = {
    allow_hq_activities: prefs?.allow_hq_activities ?? true,
    allow_actor_interactions: prefs?.allow_actor_interactions ?? true,
    prefer_no_video_capture: prefs?.prefer_no_video_capture ?? false,
    max_prep_minutes: prefs?.max_prep_minutes ?? 90
  };

  const formattedMissions = (missions ?? []).map(m => ({
    id: m.id,
    title: m.title,
    enabled: m.enabled !== false,
    requires_video: m.requires_video ?? false,
    requires_photo: m.requires_photo ?? true,
    requires_actor: m.requires_actor ?? false,
    hq_candidate: m.hq_candidate ?? false,
    activity_candidate: m.activity_candidate ?? false,
    prop_requirements: Array.isArray(m.prop_requirements) ? m.prop_requirements : [],
    expected_minutes: m.expected_minutes,
    p95_minutes: m.p95_minutes
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/events/${id}`} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-spy-gold" />
          <h1 className="text-3xl font-bold text-white">Mission Preferences</h1>
        </div>
      </div>

      {event && (
        <div className="text-gray-400 text-sm">
          Event: <span className="text-white font-medium">{event.child_name || 'Unnamed Event'}</span>
        </div>
      )}

      {/* Main Content */}
      <MissionPreferencesClient
        eventId={id}
        initialPreferences={preferences}
        initialMissions={formattedMissions}
      />
    </div>
  );
}