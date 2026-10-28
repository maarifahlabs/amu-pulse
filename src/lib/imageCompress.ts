/** Longest side, in pixels, of a saved profile photo. Enough for avatars and the profile page. */
const MAX_DIMENSION = 800;
const QUALITY = 0.8;

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/**
 * Resizes an image to fit within MAX_DIMENSION and re-encodes it as WebP (JPEG fallback).
 * Returns the original file untouched if re-encoding would not make it smaller.
 */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process this image. Try another photo.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  // Some older browsers cannot encode WebP and silently return PNG, so check the type we got back.
  let blob = await toBlob(canvas, "image/webp");
  if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg");
  if (!blob) throw new Error("Could not process this image. Try another photo.");

  return scale === 1 && file.size <= blob.size ? file : blob;
}
