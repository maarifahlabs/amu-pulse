import type { Metadata } from "next";
import Link from "next/link";
import { IssueCard } from "@/components/IssueCard";
import { filterIssues, getDataset, issueCategories, issueResponseCount } from "@/lib/data";

export const metadata: Metadata = {
  title: "AMUSU election issues",
  description: "Campus issues in the AMU Students' Union (AMUSU) election 2026, with every candidate's published response on AMU Pulse.",
};

export default async function IssuesPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const { category, q } = await searchParams;
  const ds = await getDataset();
  const issues = filterIssues(ds, { category, q });
  const categories = issueCategories(ds);

  return (
    <div className="container-page space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Campus issues</h1>
        <p className="text-slate-600">Each issue lists every candidate. Those who haven&apos;t responded are shown as awaiting response.</p>
      </header>

      <form className="flex gap-2" role="search">
        {category && <input type="hidden" name="category" value={category} />}
        <label htmlFor="q" className="sr-only">Search issues</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search issues…" className="input" />
        <button className="btn-secondary">Search</button>
      </form>

      <nav aria-label="Categories" className="flex flex-wrap gap-2">
        <Link href="/issues" className={`badge px-3 py-1 ${!category ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/issues?category=${encodeURIComponent(c)}`}
            className={`badge px-3 py-1 ${category === c ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
          >
            {c}
          </Link>
        ))}
      </nav>

      {issues.length === 0 ? (
        <p className="text-slate-600">No issues match your search.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} responses={issueResponseCount(ds, issue.id)} total={ds.candidates.length} />
          ))}
        </div>
      )}
    </div>
  );
}
