"use client";

import { useState } from "react";

export function PhotoField({ id = "photo", name = "photo" }: { id?: string; name?: string }) {
  const [fileName, setFileName] = useState("No photo chosen");

  return (
    <label htmlFor={id} className="flex cursor-pointer flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-brand-600 bg-brand-50 px-4 py-3">
      <span className="btn-primary pointer-events-none">Choose photo</span>
      <span className="min-w-0 text-sm font-medium text-slate-800">{fileName}</span>
      <input
        id={id}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => setFileName(event.target.files?.[0]?.name || "No photo chosen")}
      />
    </label>
  );
}
