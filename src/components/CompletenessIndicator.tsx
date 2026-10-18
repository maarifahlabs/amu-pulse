import type { completeness } from "@/lib/data";

type Completeness = ReturnType<typeof completeness>;

function Item({ done, label }: { done: boolean; label: string }) {
  return (
    <li className={`badge ${done ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-500"}`}>
      <span aria-hidden className="mr-1">{done ? "✓" : "○"}</span>
      {label}
      <span className="sr-only">{done ? " submitted" : " not submitted"}</span>
    </li>
  );
}

/** Shows what a candidate has submitted. It is deliberately not a score. */
export function CompletenessIndicator({ data }: { data: Completeness }) {
  return (
    <ul aria-label="Profile completeness" className="flex flex-wrap gap-1.5">
      <Item done={data.bio} label="Bio" />
      <Item done={data.manifesto} label="Manifesto" />
      <Item done={data.answered > 0} label={`Answers ${data.answered}/${data.totalIssues}`} />
    </ul>
  );
}
