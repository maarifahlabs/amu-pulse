export function VoteCount({ votes, large = false }: { votes: number; large?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full bg-[#f5c400] text-slate-950 shadow-sm ${large ? "px-4 py-2" : "px-3 py-1.5"}`}>
      <span className={`font-extrabold leading-none ${large ? "text-3xl" : "text-xl"}`}>{votes}</span>
      <span className="text-xs font-bold uppercase tracking-wide">{votes === 1 ? "vote" : "votes"}</span>
    </span>
  );
}
