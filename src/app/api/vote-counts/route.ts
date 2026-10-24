import { NextResponse } from "next/server";
import { getVoteCounts } from "@/lib/data";

export const revalidate = 60;

export async function GET() {
  const counts = await getVoteCounts();
  return NextResponse.json(counts, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" },
  });
}
