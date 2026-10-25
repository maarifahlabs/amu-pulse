import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { electionSchedule } from "@/lib/election-schedule";
import type { Candidate, CandidateAnswer, Dataset, ElectionEvent, Issue, Manifesto, Position } from "@/lib/types";

export interface TrendingRow {
  slug: string;
  daily_views: number;
  total_views: number;
}

const CANDIDATE_COLUMNS =
  "id, slug, profile_id, position_id, ballot_number, name, department, faculty, bio, photo_url, verification_status, official_source_url";

export function useDataset() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [trending, setTrending] = useState<TrendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [
        positionsRes,
        candidatesRes,
        manifestosRes,
        issuesRes,
        answersRes,
        eventsRes,
        trendingRes,
        votesRes,
      ] = await Promise.all([
        supabase.from("positions").select("id, slug, title, description, sort_order").order("sort_order"),
        supabase.from("candidates").select(CANDIDATE_COLUMNS).order("ballot_number").order("name"),
        supabase.from("manifestos").select("id, candidate_id, content, source_url, published_at").order("published_at", { ascending: false }),
        supabase.from("issues").select("id, slug, title, description, context, category, published_at").order("published_at", { ascending: false }),
        supabase.from("candidate_answers").select("id, candidate_id, issue_id, answer, source_url, updated_at"),
        supabase.from("election_events").select("id, title, description, kind, starts_at, source_url, verified_at").order("starts_at"),
        supabase.rpc("trending_candidates", { p_limit: 5 }),
        supabase.rpc("get_candidate_vote_counts"),
      ]);

      // Populate vote counts dictionary directly from Supabase RPC
      const counts: Record<string, number> = {};
      if (votesRes.data && Array.isArray(votesRes.data)) {
        for (const row of votesRes.data) {
          counts[row.candidate_id] = Number(row.vote_count ?? 0);
        }
      }
      setVoteCounts(counts);

      const positionRows = (positionsRes.data ?? []) as Position[];
      const positionOrder = new Map(positionRows.map((p, i) => [p.id, i]));
      const candidateRows = ((candidatesRes.data ?? []) as Candidate[]).sort(
        (a, b) => (positionOrder.get(a.position_id) ?? 0) - (positionOrder.get(b.position_id) ?? 0)
      );

      setDataset({
        isSample: false,
        positions: positionRows,
        candidates: candidateRows,
        manifestos: (manifestosRes.data ?? []) as Manifesto[],
        issues: (issuesRes.data ?? []) as Issue[],
        answers: (answersRes.data ?? []) as CandidateAnswer[],
        events: eventsRes.data?.length ? (eventsRes.data as ElectionEvent[]) : electionSchedule,
      });

      if (trendingRes.data && Array.isArray(trendingRes.data)) {
        setTrending(
          trendingRes.data.map((r: any) => ({
            slug: r.slug,
            daily_views: Number(r.daily_views ?? 0),
            total_views: Number(r.total_views ?? 0),
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return { dataset, voteCounts, trending, loading, error, refresh: loadData };
}
