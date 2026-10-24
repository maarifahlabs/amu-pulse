"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { VoteCount } from "@/components/VoteCount";

const VoteCountContext = createContext<Record<string, number> | null>(null);

export function VoteCountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/vote-counts", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: Record<string, number> | null) => {
        if (body && typeof body === "object") setCounts(body);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return <VoteCountContext.Provider value={counts}>{children}</VoteCountContext.Provider>;
}

export function useVoteCounts() {
  return useContext(VoteCountContext);
}

export function LiveVoteCount({ id, initial, large = false }: { id: string; initial: number; large?: boolean }) {
  const counts = useVoteCounts();
  const votes = counts ? counts[id] ?? 0 : initial;
  return <VoteCount votes={votes} large={large} />;
}
