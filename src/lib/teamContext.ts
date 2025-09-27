'use client';

import { useEffect, useState } from 'react';

type TeamCtx = { teamId: string; routeId: string; teamCode: string };

const key = (eventId: string) => `teamCtx:${eventId}`;

export function persistTeamCtx(eventId: string, ctx: TeamCtx) {
  try { localStorage.setItem(key(eventId), JSON.stringify(ctx)); } catch {}
}

export function readTeamCtx(eventId: string): TeamCtx | null {
  try {
    const raw = localStorage.getItem(key(eventId));
    return raw ? JSON.parse(raw) as TeamCtx : null;
  } catch { return null; }
}

export function useTeamCtx(eventId: string) {
  const [ctx, setCtx] = useState<TeamCtx | null>(null);
  useEffect(() => { setCtx(readTeamCtx(eventId)); }, [eventId]);
  return { ctx, setCtx: (c: TeamCtx) => { persistTeamCtx(eventId, c); setCtx(c); } };
}