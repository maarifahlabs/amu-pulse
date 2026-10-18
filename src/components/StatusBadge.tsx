const STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  published: "bg-brand-50 text-brand-700",
  approved: "bg-brand-50 text-brand-700",
  verified: "bg-brand-50 text-brand-700",
  rejected: "bg-red-50 text-red-700",
  unverified: "bg-slate-100 text-slate-600",
  draft: "bg-slate-100 text-slate-600",
  archived: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  return <span className={`badge capitalize ${STYLES[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
}
