'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function EventTeamsPage({ params }: { params: { id: string } }) {
  const eventId = params.id;
  const [event, setEvent] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    try {
      // Load event details
      const { data: eventData } = await supabase
        .from('events')
        .select('id, child_name, participant_count, status')
        .eq('id', eventId)
        .single();

      if (eventData) setEvent(eventData);

      // Load existing teams
      const { data: teamsData } = await supabase
        .from('event_teams')
        .select('id, password, route_id')
        .eq('event_id', eventId)
        .order('password');

      if (teamsData) setTeams(teamsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateTeams() {
    if (!event) return;

    setGenerating(true);
    try {
      // Delete existing teams first
      await supabase
        .from('event_teams')
        .delete()
        .eq('event_id', eventId);

      // Calculate number of teams (ceil of participants / 6)
      const teamCount = Math.ceil(event.participant_count / 6);

      // Generate unique 4-digit codes
      const newTeams = [];
      const usedCodes = new Set();

      for (let i = 0; i < teamCount; i++) {
        let code;
        do {
          code = Math.floor(1000 + Math.random() * 9000).toString();
        } while (usedCodes.has(code));
        usedCodes.add(code);

        newTeams.push({
          event_id: eventId,
          password: code,
          route_id: `route_${i + 1}` // Simple route assignment for MVP
        });
      }

      // Insert new teams
      const { data: insertedTeams } = await supabase
        .from('event_teams')
        .insert(newTeams)
        .select();

      if (insertedTeams) {
        setTeams(insertedTeams);
      }
    } catch (error) {
      console.error('Error generating teams:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function finalize() {
    try {
      await supabase
        .from('events')
        .update({ status: 'active' })
        .eq('id', eventId);

      router.push(`/dashboard/events/${eventId}/print`);
    } catch (error) {
      console.error('Error finalizing event:', error);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center text-red-600">Event not found</div>
      </div>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Team Setup</h1>
        <p className="text-gray-600">Event: {event.child_name} ({event.participant_count} participants)</p>
      </div>

      <div className="bg-white p-6 rounded-lg border mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Teams</h2>
          <button
            onClick={generateTeams}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Teams'}
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No teams generated yet.</p>
            <p className="text-sm mt-2">Click "Generate Teams" to create team codes automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {teams.map((team, index) => (
              <div key={team.id} className="p-4 border rounded-lg text-center">
                <div className="text-sm text-gray-600">Team {index + 1}</div>
                <div className="text-2xl font-mono font-bold text-blue-600">{team.password}</div>
                <div className="text-xs text-gray-500">{team.route_id}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {teams.length > 0 && (
        <div className="flex justify-between">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={finalize}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Finalize & Continue to Print
          </button>
        </div>
      )}
    </main>
  );
}