import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { api } from "@/lib/api";
import { compressImage } from "@/lib/imageCompress";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function formatKb(bytes: number) {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function CandidatePhotoUpload({
  name,
  photoUrl,
  onUploaded,
}: {
  name: string;
  photoUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Show the local preview while uploading, then fall back to the saved photo.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setMessage(null);
    setBusy(true);
    try {
      const compressed = await compressImage(file);
      if (compressed.size > MAX_UPLOAD_BYTES) throw new Error("Photo is too large even after compression. Try a smaller image.");

      const ext = compressed.type === "image/webp" ? "webp" : compressed.type === "image/png" ? "png" : "jpg";
      const form = new FormData();
      form.append("photo", compressed, `photo.${ext}`);

      const { photo_url } = await api.upload<{ photo_url: string }>("/me/candidate/photo", form);
      setPreview(URL.createObjectURL(compressed));
      onUploaded(photo_url);
      setMessage({
        type: "ok",
        text: `Photo saved (${formatKb(file.size)} → ${formatKb(compressed.size)}).`,
      });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Photo upload failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-4">
      <Avatar name={name} photoUrl={preview || photoUrl} size={80} />
      <div className="min-w-0 flex-1 space-y-2">
        <label htmlFor="candidate-photo-upload" className="label font-semibold">Profile photo</label>
        <input
          id="candidate-photo-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={handleFile}
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:font-semibold file:text-white hover:file:bg-brand-700 disabled:opacity-50"
        />
        <p className="text-xs text-slate-500">
          JPEG, PNG or WebP. Images are resized and compressed automatically before upload.
        </p>
        {busy && <p className="text-xs font-medium text-slate-600">Compressing and uploading…</p>}
        {message && (
          <p className={`text-xs font-medium ${message.type === "ok" ? "text-emerald-700" : "text-rose-700"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
