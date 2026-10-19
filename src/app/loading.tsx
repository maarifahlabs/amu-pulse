export default function Loading() {
  return (
    <div className="container-page flex justify-center py-24" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
    </div>
  );
}
