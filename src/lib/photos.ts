import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function extensionFor(file: File) {
  const fromType = EXT_BY_TYPE[file.type];
  if (fromType) return fromType;
  const match = file.name.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = match?.[1];
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "png" || ext === "webp") return ext;
  return null;
}

function asFile(entry: FormDataEntryValue | null) {
  if (!entry || typeof entry === "string") return null;
  if (typeof entry.arrayBuffer !== "function" || entry.size <= 0) return null;
  return entry;
}

/** Uploads a profile photo and returns its public URL. An empty file input returns null. */
export async function uploadCandidatePhoto(
  db: SupabaseClient,
  candidateId: string,
  entry: FormDataEntryValue | null,
) {
  const file = asFile(entry);
  if (!file) return null;
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Photo must be 5 MB or smaller.");
  const ext = extensionFor(file);
  if (!ext) throw new Error("Photo must be a JPEG, PNG or WebP image.");

  const path = `${candidateId}/${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await db.storage.from("candidate-photos").upload(path, bytes, {
    contentType: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message || "Photo upload failed.");
  return db.storage.from("candidate-photos").getPublicUrl(path).data.publicUrl;
}
