'use client';

import { useEffect, useState } from 'react';
import { TeamKeypad } from '@/components/TeamKeypad';
import { useTeamCtx } from '@/lib/teamContext';

export default function ScanPage({ params }: { params: { eventId: string; stationId: string } }) {
  const { eventId, stationId } = params;
  const { ctx, setCtx } = useTeamCtx(eventId);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (ctx) {
      // we have team context → go straight to playback page (or fetch then render inline)
      window.location.replace(`/play/${ctx.teamId}/station/${stationId}`);
    }
  }, [ctx, stationId]);

  async function submit(code: string) {
    setError(undefined);
    const res = await fetch(`/api/events/${eventId}/teams/session`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamCode: code })
    });
    if (!res.ok) { setError('Wrong code for this party'); return; }
    const data = await res.json() as { teamId: string; routeId: string; teamCode: string };
    setCtx(data); // persists to localStorage
    window.location.replace(`/play/${data.teamId}/station/${stationId}`);
  }

  return (
    <main className="p-6 flex flex-col items-center gap-6">
      <h1 className="text-2xl">Enter your team code</h1>
      <TeamKeypad onSubmit={submit} error={error}/>
      <p className="text-xs opacity-70">Tip: you only need to enter it once on this phone.</p>
    </main>
  );
}