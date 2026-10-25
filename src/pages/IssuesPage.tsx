import { Link, useSearchParams } from "react-router-dom";
import { IssueCard } from "@/components/IssueCard";
import { filterIssues, issueCategories, issueResponseCount } from "@/lib/data";
import { useDataset } from "@/hooks/useDataset";

export function IssuesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const { dataset: ds, loading } = useDataset();

  if (loading || !ds) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading campus issues…</p>
      </div>
    );
  }

  const issues = filterIssues(ds, { category, q });
  const categories = issueCategories(ds);

  function handleSearch(val: string) {
    const next = new URLSearchParams(searchParams);
    if (val.trim()) {
      next.set("q", val);
    } else {
      next.delete("q");
    }
    setSearchParams(next);
  }

  function handleCategory(cat?: string) {
    const next = new URLSearchParams(searchParams);
    if (cat) {
      next.set("category", cat);
    } else {
      next.delete("category");
    }
    setSearchParams(next);
  }

  return (
    <div className="container-page space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl font-display">Campus issues</h1>
        <p className="text-slate-600">
          Each issue lists every candidate. Those who haven&apos;t responded are shown as awaiting response.
        </p>
      </header>

      <div className="flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">Search issues</label>
        <input
          id="q"
          name="q"
          value={q ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search issues…"
          className="input"
        />
      </div>

      <nav aria-label="Categories" className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleCategory(undefined)}
          className={`badge px-3 py-1 cursor-pointer transition ${
            !category ? "bg-brand-600 text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => handleCategory(c)}
            className={`badge px-3 py-1 cursor-pointer transition ${
              category === c ? "bg-brand-600 text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {c}
          </button>
        ))}
      </nav>

      {issues.length === 0 ? (
        <div className="card text-center py-12 text-slate-600 space-y-2">
          <p className="text-base font-semibold">No issues match your search.</p>
          {(q || category) && (
            <button
              onClick={() => setSearchParams(new URLSearchParams())}
              className="text-brand-700 underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              responses={issueResponseCount(ds, issue.id)}
              total={ds.candidates.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}
