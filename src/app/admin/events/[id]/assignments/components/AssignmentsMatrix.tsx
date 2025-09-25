'use client';
import { useState } from 'react';

type Props = {
  teams: {id: string, name?: string}[];
  missions: {id: string, title?: string}[];
  stations: {id: string, display_name?: string}[];
  value: Record<string, Record<string, string | undefined>>;
  onChange: (teamId: string, missionId: string, stationId: string) => void;
};

export function AssignmentsMatrix({ teams, missions, stations, value, onChange }: Props) {
  return (
    <div className="overflow-auto border rounded-xl">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white px-3 py-2 text-left">Mission</th>
            {teams.map(t => (
              <th key={t.id} className="px-3 py-2 text-left">
                {t.name || t.id.slice(0, 4)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {missions.map(m => (
            <tr key={m.id} className="border-t">
              <td className="sticky left-0 bg-white px-3 py-2 font-medium">
                {m.title || m.id.slice(0, 6)}
              </td>
              {teams.map(t => (
                <td key={t.id} className="px-3 py-2">
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={value[t.id]?.[m.id] || ''}
                    onChange={e => onChange(t.id, m.id, e.target.value)}
                  >
                    <option value="">—</option>
                    {stations.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.display_name || s.id.slice(0, 6)}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}