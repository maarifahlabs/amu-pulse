import Link from "next/link";
import type { Issue } from "@/lib/types";

export function IssueCard({ issue, responses, total }: { issue: Issue; responses: number; total: number }) {
  return (
    <Link href={`/issues/${issue.slug}`} className="card flex flex-col gap-3 transition hover:border-brand-500">
      <span className="badge w-fit bg-brand-50 text-brand-700">{issue.category}</span>
      <h3 className="text-base font-semibold leading-snug">{issue.title}</h3>
      {issue.description && <p className="line-clamp-2 text-sm text-slate-600">{issue.description}</p>}
      <p className="mt-auto text-xs font-medium text-slate-500">
        {responses} of {total} candidates responded
      </p>
    </Link>
  );
}
