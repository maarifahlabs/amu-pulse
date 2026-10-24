"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function IssueFilters({ categories }: { categories: string[] }) {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setQ(params.get("q") ?? "");
    setCategory(params.get("category") ?? "");
    setReady(true);
  }, [params]);

  useEffect(() => {
    if (!ready) return;
    const query = q.trim().toLowerCase();
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", q.trim());
    else url.searchParams.delete("q");
    if (category) url.searchParams.set("category", category);
    else url.searchParams.delete("category");
    const next = `${url.pathname}${url.search}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }

    let visible = 0;
    document.querySelectorAll<HTMLElement>("[data-issue]").forEach((card) => {
      const hay = card.dataset.search ?? "";
      const group = card.dataset.category ?? "";
      const hide = Boolean((category && group !== category) || (query && !hay.includes(query)));
      card.hidden = hide;
      if (!hide) visible += 1;
    });
    const empty = document.querySelector<HTMLElement>("[data-issue-empty]");
    if (empty) empty.hidden = visible > 0;
  }, [q, category, ready]);

  return (
    <>
      <form className="flex gap-2" role="search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="issue-q" className="sr-only">Search issues</label>
        <input id="issue-q" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search issues…" className="input" />
      </form>
      <nav aria-label="Categories" className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setCategory("")} className={`badge px-3 py-1 ${!category ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>
          All
        </button>
        {categories.map((item) => (
          <button key={item} type="button" onClick={() => setCategory(item)} className={`badge px-3 py-1 ${category === item ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>
            {item}
          </button>
        ))}
      </nav>
    </>
  );
}
