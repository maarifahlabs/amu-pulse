import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { electionSchedule } from "@/lib/election-schedule";
import type { Candidate, CandidateAnswer, Dataset, ElectionEvent, Issue, Manifesto, Position } from "@/lib/types";

export interface TrendingRow {
  slug: string;
  daily_views: number;
  total_views: number;
}

interface DatasetContextType {
  dataset: Dataset | null;
  voteCounts: Record<string, number>;
  trending: TrendingRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  incrementVoteCount: (candidateId: string) => void;
}

const DatasetContext = createContext<DatasetContextType>({
  dataset: null,
  voteCounts: {},
  trending: [],
  loading: true,
  error: null,
  refresh: async () => {},
  incrementVoteCount: () => {},
});

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [trending, setTrending] = useState<TrendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      // A failed section loads as empty instead of blanking the whole site.
      const load = <T,>(path: string) =>
        api.get<T>(path).then(
          (data) => ({ data }),
          () => ({ data: null as T | null }),
        );

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
        load<Position[]>("/positions"),
        load<Candidate[]>("/candidates"),
        load<Manifesto[]>("/manifestos"),
        load<Issue[]>("/issues"),
        load<CandidateAnswer[]>("/candidate-answers"),
        load<ElectionEvent[]>("/election-events"),
        load<TrendingRow[]>("/candidates/trending?limit=5"),
        load<{ candidate_id: string; vote_count: number }[]>("/votes/counts"),
      ]);

      // Populate vote counts dictionary
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
  }, []);

  const incrementVoteCount = useCallback((candidateId: string) => {
    setVoteCounts((prev) => ({
      ...prev,
      [candidateId]: (prev[candidateId] ?? 0) + 1,
    }));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <DatasetContext.Provider
      value={{ dataset, voteCounts, trending, loading, error, refresh: loadData, incrementVoteCount }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  return useContext(DatasetContext);
}
