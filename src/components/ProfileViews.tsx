"use client";

import { useEffect, useState } from "react";

const recorded = new Set<string>();

export function ProfileViews({ slug, record = true }: { slug: string; record?: boolean }) {
  const [stats, setStats] = useState<{ daily: number; total: number } | null>(null);

  useEffect(() => {
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const key = `${slug}:${day}`;
    const method = record && !recorded.has(key) ? "POST" : "GET";
    if (method === "POST") recorded.add(key);

    const controller = new AbortController();
    fetch(`/api/views/${slug}`, { method, signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { daily?: number; total?: number; ready?: boolean } | null) => {
        if (!body?.ready) return;
        setStats({ daily: body.daily ?? 0, total: body.total ?? 0 });
      })
      .catch(() => {});

    return () => {
      if (method === "GET") controller.abort();
    };
  }, [slug, record]);

  if (!stats) return null;

  return (
    <p className="text-sm text-slate-600">
      <span className="font-semibold text-slate-800">{stats.daily}</span> views today
      <span aria-hidden> · </span>
      <span className="font-semibold text-slate-800">{stats.total}</span> total
    </p>
  );
}
