import { initials } from "@/lib/format";

export function Avatar({ name, photoUrl, size = 56 }: { name: string; photoUrl: string | null; size?: number }) {
  const style = { width: size, height: size };
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="" style={style} className="shrink-0 rounded-full object-cover" />;
  }
  return (
    <span
      aria-hidden
      style={style}
      className="grid shrink-0 place-items-center rounded-full bg-slate-200 font-semibold text-slate-600"
    >
      {initials(name)}
    </span>
  );
}
