export function FlashMessage({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`rounded-xl px-4 py-3 text-sm font-medium ${error ? "bg-red-50 text-red-800" : "bg-brand-50 text-brand-900"}`}
    >
      {error ?? ok}
    </div>
  );
}
