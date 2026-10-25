import { useSearchParams } from "react-router-dom";
import type { Position } from "@/lib/types";

export function CandidateFilters({
  positions,
}: {
  positions: Position[];
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const position = searchParams.get("position") ?? "";

  function handleSearch(val: string) {
    const next = new URLSearchParams(searchParams);
    if (val.trim()) {
      next.set("q", val);
    } else {
      next.delete("q");
    }
    setSearchParams(next);
  }

  function handlePosition(val: string) {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set("position", val);
    } else {
      next.delete("position");
    }
    setSearchParams(next);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row" role="search">
      <label htmlFor="q" className="sr-only">Search candidates</label>
      <input
        id="q"
        name="q"
        value={q}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search by name or faculty…"
        className="input"
      />
      <label htmlFor="position" className="sr-only">Position</label>
      <select
        id="position"
        name="position"
        value={position}
        className="input sm:max-w-md"
        onChange={(e) => handlePosition(e.target.value)}
      >
        <option value="">All positions</option>
        {positions.map((p) => (
          <option key={p.id} value={p.slug}>{p.title}</option>
        ))}
      </select>
    </div>
  );
}
