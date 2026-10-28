import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const recorded = new Set<string>();

export function ProfileViews({ slug, record = true }: { slug: string; record?: boolean }) {
  const [stats, setStats] = useState<{ daily: number; total: number } | null>(null);

  useEffect(() => {
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const key = `${slug}:${day}`;
    const shouldRecord = record && !recorded.has(key);
    if (shouldRecord) recorded.add(key);

    async function fetchStats() {
      try {
        const path = `/candidates/${encodeURIComponent(slug)}/views`;
        const row = shouldRecord
          ? await api.post<{ daily_views: number; total_views: number }>(path)
          : await api.get<{ daily_views: number; total_views: number }>(path);
        setStats({
          daily: Number(row.daily_views ?? 0),
          total: Number(row.total_views ?? 0),
        });
      } catch {
        // Ignore view errors silently
      }
    }

    if (slug) {
      fetchStats();
    }
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
