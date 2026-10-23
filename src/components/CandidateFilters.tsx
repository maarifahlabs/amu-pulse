"use client";

import type { Position } from "@/lib/types";

export function CandidateFilters({
  positions,
  position,
  q,
}: {
  positions: Position[];
  position?: string;
  q?: string;
}) {
  return (
    <form className="flex flex-col gap-2 sm:flex-row" role="search">
      <label htmlFor="q" className="sr-only">Search candidates</label>
      <input id="q" name="q" defaultValue={q} placeholder="Search by name or faculty…" className="input" />
      <label htmlFor="position" className="sr-only">Position</label>
      <select
        id="position"
        name="position"
        defaultValue={position ?? ""}
        className="input sm:max-w-md"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option value="">All positions</option>
        {positions.map((p) => (
          <option key={p.id} value={p.slug}>{p.title}</option>
        ))}
      </select>
    </form>
  );
}
