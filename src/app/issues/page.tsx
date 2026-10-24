import type { Metadata } from "next";
import { Suspense } from "react";
import { IssueCard } from "@/components/IssueCard";
import { IssueFilters } from "@/components/IssueFilters";
import { getDataset, issueCategories, issueResponseCount } from "@/lib/data";

export const metadata: Metadata = {
  title: "AMUSU election issues",
  description: "Campus issues in the AMU Students' Union (AMUSU) election 2026, with every candidate's published response on AMU Pulse.",
};

export const revalidate = 1800;

export default async function IssuesPage() {
  const ds = await getDataset();
  const categories = issueCategories(ds);

  return (
    <div className="container-page space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Campus issues</h1>
        <p className="text-slate-600">Each issue lists every candidate. Those who haven&apos;t responded are shown as awaiting response.</p>
      </header>

      <Suspense fallback={null}>
        <IssueFilters categories={categories} />
      </Suspense>

      {ds.issues.length === 0 ? (
        <p className="text-slate-600">No issues match your search.</p>
      ) : (
        <>
          <p data-issue-empty hidden className="text-slate-600">No issues match your search.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ds.issues.map((issue) => (
              <div
                key={issue.id}
                data-issue=""
                data-category={issue.category}
                data-search={`${issue.title} ${issue.description ?? ""} ${issue.category}`.toLowerCase()}
              >
                <IssueCard issue={issue} responses={issueResponseCount(ds, issue.id)} total={ds.candidates.length} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
