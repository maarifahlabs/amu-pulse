const TZ = "Asia/Kolkata";

export function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: TZ }).format(new Date(iso));
}

export function formatDateTime(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(new Date(iso));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Faculty under a candidate name, with department only when faculty is missing. */
export function candidatePlace(candidate: { faculty?: string | null; department?: string | null }) {
  return candidate.faculty?.trim() || candidate.department?.trim() || "";
}

/** Reads a field from an untyped Supabase join, which may be an object or a one-element array. */
export function joinedField(value: unknown, field: string): string {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return "";
  const result = (row as Record<string, unknown>)[field];
  return typeof result === "string" ? result : "";
}

export function messageHref(path: string, kind: "ok" | "error", message: string) {
  return `${path}?${kind}=${encodeURIComponent(message)}`;
}
