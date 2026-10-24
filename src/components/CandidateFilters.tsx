"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useVoteCounts } from "@/components/VoteCounts";
import type { Position } from "@/lib/types";

export function CandidateFilters({ positions }: { positions: Position[] }) {
  const params = useSearchParams();
  const counts = useVoteCounts();
  const [q, setQ] = useState("");
  const [position, setPosition] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setQ(params.get("q") ?? "");
    setPosition(params.get("position") ?? "");
    setReady(true);
  }, [params]);

  useEffect(() => {
    if (!ready) return;
    const query = q.trim().toLowerCase();
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", q.trim());
    else url.searchParams.delete("q");
    if (position) url.searchParams.set("position", position);
    else url.searchParams.delete("position");
    const next = `${url.pathname}${url.search}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }

    let visible = 0;
    document.querySelectorAll<HTMLElement>("[data-candidate]").forEach((card) => {
      const hay = card.dataset.search ?? "";
      const post = card.dataset.position ?? "";
      const hide = Boolean((position && post !== position) || (query && !hay.includes(query)));
      card.hidden = hide;
      if (!hide) visible += 1;
    });
    document.querySelectorAll<HTMLElement>("[data-post]").forEach((section) => {
      const shown = section.querySelectorAll("[data-candidate]:not([hidden])").length;
      section.hidden = shown === 0;
      const count = section.querySelector("[data-count]");
      if (count) count.textContent = String(shown);
    });
    const empty = document.querySelector<HTMLElement>("[data-candidate-empty]");
    if (empty) empty.hidden = visible > 0;

    if (!counts) return;
    document.querySelectorAll<HTMLElement>("[data-candidate-grid]").forEach((grid) => {
      const cards = [...grid.querySelectorAll<HTMLElement>("[data-candidate]")];
      cards.sort((a, b) => {
        const diff = (counts[b.dataset.id ?? ""] ?? 0) - (counts[a.dataset.id ?? ""] ?? 0);
        return diff || (a.dataset.name ?? "").localeCompare(b.dataset.name ?? "");
      });
      for (const card of cards) grid.appendChild(card);
    });
  }, [q, position, counts, ready]);

  return (
    <form className="flex flex-col gap-2 sm:flex-row" role="search" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="q" className="sr-only">Search candidates</label>
      <input id="q" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search by name or faculty…" className="input" />
      <label htmlFor="position" className="sr-only">Position</label>
      <select id="position" value={position} className="input sm:max-w-md" onChange={(event) => setPosition(event.target.value)}>
        <option value="">All positions</option>
        {positions.map((p) => (
          <option key={p.id} value={p.slug}>{p.title}</option>
        ))}
      </select>
    </form>
  );
}
