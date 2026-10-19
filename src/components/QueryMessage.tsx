"use client";

import { useSearchParams } from "next/navigation";
import { FlashMessage } from "@/components/FlashMessage";

export function QueryMessage() {
  const params = useSearchParams();
  const ok = params.get("ok") ?? undefined;
  const error = params.get("error") ?? undefined;
  if (!ok && !error) return null;
  return (
    <div className="container-page pt-4">
      <FlashMessage ok={ok} error={error} />
    </div>
  );
}
