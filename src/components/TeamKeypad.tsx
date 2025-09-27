'use client';

import { useState } from 'react';

export function TeamKeypad({ onSubmit, error }: { onSubmit: (code: string) => Promise<void>; error?: string }) {
  const [code, setCode] = useState('');

  const push = (d: string) => { if (code.length < 4) setCode(code + d); };
  const back = () => setCode(code.slice(0, -1));
  const go = async () => { if (code.length === 4) await onSubmit(code); };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-2xl tracking-widest font-mono">{code.padEnd(4, '•')}</div>
      {error && <div className="text-red-500">{error}</div>}
      <div className="grid grid-cols-3 gap-3 w-64">
        {'123456789'.split('').map(n => (
          <button key={n} onClick={() => push(n)} className="p-4 rounded-xl shadow"> {n} </button>
        ))}
        <button onClick={back} className="p-4 rounded-xl shadow">←</button>
        <button onClick={() => push('0')} className="p-4 rounded-xl shadow">0</button>
        <button onClick={go} className="p-4 rounded-xl shadow bg-black text-white">OK</button>
      </div>
    </div>
  );
}