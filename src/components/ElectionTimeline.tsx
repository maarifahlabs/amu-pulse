import { formatDate, formatDateTime } from "@/lib/format";
import type { ElectionEvent } from "@/lib/types";

function when(event: ElectionEvent) {
  if (event.time_label) return `${formatDate(event.starts_at)} · ${event.time_label}`;
  return formatDateTime(event.starts_at);
}

export function ElectionTimeline({ events }: { events: ElectionEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-600">No verified dates published yet. Check the official AMU Registrar notices.</p>;
  }
  return (
    <div className="space-y-4">
      <ol className="relative space-y-5 border-l-2 border-brand-100 pl-5">
        {events.map((event) => (
          <li key={event.id} className="relative">
            <span aria-hidden className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-600" />
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{when(event)}</p>
            <p className="font-semibold">{event.title}</p>
            {event.description && <p className="text-sm text-slate-600">{event.description}</p>}
            {event.source_url !== "https://www.amu.ac.in/" && (
              <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-700 underline">
                Official source
              </a>
            )}
            {!event.verified_at && <span className="ml-2 badge bg-amber-100 text-amber-900">Unverified sample</span>}
          </li>
        ))}
      </ol>
      <p className="text-xs text-slate-500">Confirm any change with the AMU Registrar notices.</p>
    </div>
  );
}
