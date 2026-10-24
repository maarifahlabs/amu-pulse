import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { NameWithBadge } from "@/components/NameWithBadge";
import type { Candidate, CandidateAnswer, Issue } from "@/lib/types";

/**
 * Equal-width columns, ballot serial order, identical treatment for every
 * candidate. No ranking, scoring or highlighting.
 */
export function ComparisonTable({
  candidates,
  issues,
  answerFor,
}: {
  candidates: Candidate[];
  issues: Issue[];
  answerFor: (candidateId: string, issueId: string) => CandidateAnswer | null;
}) {
  const gridStyle = { gridTemplateColumns: `repeat(${candidates.length}, minmax(220px, 1fr))` };

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="min-w-fit space-y-4">
        <div className="grid gap-3" style={gridStyle}>
          {candidates.map((c) => (
            <Link key={c.id} href={`/candidates/${c.slug}`} prefetch={false} className="card flex items-center gap-3 p-4 hover:border-brand-500">
              <Avatar name={c.name} photoUrl={c.photo_url} size={40} />
              <NameWithBadge id={c.id} name={c.name} claimed={c.profile_id !== null} className="font-semibold" />
            </Link>
          ))}
        </div>

        {issues.map((issue) => (
          <section key={issue.id} aria-labelledby={`cmp-${issue.id}`} className="space-y-2">
            <h3 id={`cmp-${issue.id}`} className="text-sm font-semibold">
              <Link href={`/issues/${issue.slug}`} prefetch={false} className="hover:underline">{issue.title}</Link>
            </h3>
            <div className="grid gap-3" style={gridStyle}>
              {candidates.map((c) => {
                const answer = answerFor(c.id, issue.id);
                return (
                  <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                    <p className="mb-1 text-xs font-semibold text-slate-500 sm:hidden">
                      <NameWithBadge id={c.id} name={c.name} claimed={c.profile_id !== null} />
                    </p>
                    {answer ? (
                      <p className="prose-text">{answer.answer}</p>
                    ) : (
                      <p className="italic text-slate-400">Awaiting response</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
