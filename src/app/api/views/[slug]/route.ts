import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

async function stats(slug: string, record: boolean) {
  if (!isSupabaseConfigured || !SLUG.test(slug)) {
    return NextResponse.json({ ready: false, daily: 0, total: 0 });
  }

  const sb = createPublicClient();
  const { data, error } = await sb.rpc(record ? "record_candidate_view" : "candidate_view_stats", { p_slug: slug });
  if (error || !Array.isArray(data) || !data[0]) {
    return NextResponse.json({ ready: false, daily: 0, total: 0 });
  }

  const row = data[0] as { daily_views?: number; total_views?: number };
  return NextResponse.json({
    ready: true,
    daily: Number(row.daily_views ?? 0),
    total: Number(row.total_views ?? 0),
  });
}

type Params = { params: Promise<{ slug: string }> };

export function GET(_request: Request, { params }: Params) {
  return params.then(({ slug }) => stats(slug, false));
}

export function POST(_request: Request, { params }: Params) {
  return params.then(({ slug }) => stats(slug, true));
}
