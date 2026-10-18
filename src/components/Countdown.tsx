"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
  };
}

export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const remaining = now === null ? null : new Date(target).getTime() - now;
  if (remaining !== null && remaining <= 0) {
    return <p className="text-lg font-semibold">Polling day has arrived.</p>;
  }

  const p = remaining === null ? null : parts(remaining);
  const units: [string, number | undefined][] = [
    ["days", p?.days],
    ["hours", p?.hours],
    ["min", p?.minutes],
  ];

  return (
    <div className="flex gap-3" aria-live="off">
      {units.map(([label, value]) => (
        <div key={label} className="min-w-16 rounded-xl bg-white/15 px-3 py-2 text-center">
          <div className="text-2xl font-bold tabular-nums">{value ?? "–"}</div>
          <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
        </div>
      ))}
    </div>
  );
}
