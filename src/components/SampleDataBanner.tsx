import { isSupabaseConfigured } from "@/lib/env";

export function SampleDataBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div role="note" className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
      Demo mode: showing fictional sample data. No real candidate positions are represented.
    </div>
  );
}
