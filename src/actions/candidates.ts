"use server";

import { redirect } from "next/navigation";
import { audit, requireViewer } from "@/lib/auth";
import { messageHref } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  answerSchema, claimSchema, firstError, formToObject, manifestoSchema, profileUpdateSchema,
} from "@/lib/validations";

const DASHBOARD = "/candidate/dashboard";
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function fail(message: string): never {
  redirect(messageHref(DASHBOARD, "error", message));
}

function done(message: string): never {
  redirect(messageHref(DASHBOARD, "ok", message));
}

async function requireLinkedCandidate() {
  const viewer = await requireViewer(DASHBOARD);
  const { data: candidate } = await createAdminClient()
    .from("candidates")
    .select("id, verification_status")
    .eq("profile_id", viewer.id)
    .maybeSingle();
  if (!candidate) fail("Your account is not linked to a candidate profile yet.");
  return { viewer, candidate };
}

export async function submitClaim(formData: FormData) {
  const viewer = await requireViewer(DASHBOARD);
  const parsed = claimSchema.safeParse(formToObject(formData));
  if (!parsed.success) fail(firstError(parsed.error));

  const db = createAdminClient();
  const { data: candidate } = await db
    .from("candidates")
    .select("id, profile_id")
    .eq("id", parsed.data.candidateId)
    .maybeSingle();
  if (!candidate) fail("Candidate not found.");
  if (candidate.profile_id) fail("This profile has already been claimed. Contact the moderators if this is wrong.");

  const { data: existing } = await db
    .from("candidate_claims")
    .select("id")
    .eq("profile_id", viewer.id)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) fail("You already have a claim awaiting review.");

  const { data, error } = await db
    .from("candidate_claims")
    .upsert(
      { candidate_id: candidate.id, profile_id: viewer.id, evidence: parsed.data.evidence, status: "pending" },
      { onConflict: "candidate_id,profile_id" },
    )
    .select("id")
    .single();
  if (error) fail("Could not submit your claim.");

  await audit(viewer.id, "claim.submit", "candidate_claim", data.id, { candidate_id: candidate.id });
  done("Claim submitted. A moderator will verify your identity.");
}

export async function submitProfileUpdate(formData: FormData) {
  const { viewer, candidate } = await requireLinkedCandidate();
  const parsed = profileUpdateSchema.safeParse(formToObject(formData));
  if (!parsed.success) fail(firstError(parsed.error));

  const db = createAdminClient();
  let photoPendingUrl: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const ext = PHOTO_TYPES[photo.type];
    if (!ext) fail("Photo must be a JPEG, PNG or WebP image.");
    if (photo.size > MAX_PHOTO_BYTES) fail("Photo must be 2 MB or smaller.");

    const path = `${candidate.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await db.storage
      .from("candidate-photos")
      .upload(path, photo, { contentType: photo.type, upsert: false });
    if (uploadError) fail("Photo upload failed.");
    photoPendingUrl = db.storage.from("candidate-photos").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await db
    .from("candidates")
    .update({
      bio_pending: parsed.data.bio,
      ...(photoPendingUrl ? { photo_pending_url: photoPendingUrl } : {}),
      profile_update_status: "pending",
    })
    .eq("id", candidate.id);
  if (error) fail("Could not save your profile update.");

  await audit(viewer.id, "profile.submit", "candidate", candidate.id, { photo: Boolean(photoPendingUrl) });
  done("Profile update submitted for review.");
}

export async function submitManifesto(formData: FormData) {
  const { viewer, candidate } = await requireLinkedCandidate();
  const parsed = manifestoSchema.safeParse(formToObject(formData));
  if (!parsed.success) fail(firstError(parsed.error));

  const db = createAdminClient();
  // Only one pending manifesto at a time: replace any earlier pending draft.
  await db.from("manifestos").delete().eq("candidate_id", candidate.id).eq("status", "pending");
  const { data, error } = await db
    .from("manifestos")
    .insert({ candidate_id: candidate.id, content: parsed.data.content, source_url: parsed.data.sourceUrl })
    .select("id")
    .single();
  if (error) fail("Could not submit your manifesto.");

  await audit(viewer.id, "manifesto.submit", "manifesto", data.id);
  done("Manifesto submitted for review.");
}

export async function submitAnswer(formData: FormData) {
  const { viewer, candidate } = await requireLinkedCandidate();
  const parsed = answerSchema.safeParse(formToObject(formData));
  if (!parsed.success) fail(firstError(parsed.error));

  const db = createAdminClient();
  const { data: issue } = await db
    .from("issues")
    .select("id")
    .eq("id", parsed.data.issueId)
    .eq("status", "published")
    .maybeSingle();
  if (!issue) fail("This issue is not open for answers.");

  // Edits return to moderation; the previous version is kept in the audit log.
  const { data: previous } = await db
    .from("candidate_answers")
    .select("answer, status")
    .eq("candidate_id", candidate.id)
    .eq("issue_id", issue.id)
    .maybeSingle();

  const { data, error } = await db
    .from("candidate_answers")
    .upsert(
      {
        candidate_id: candidate.id,
        issue_id: issue.id,
        answer: parsed.data.answer,
        source_url: parsed.data.sourceUrl,
        status: "pending",
      },
      { onConflict: "candidate_id,issue_id" },
    )
    .select("id")
    .single();
  if (error) fail("Could not submit your answer.");

  await audit(viewer.id, previous ? "answer.edit" : "answer.submit", "candidate_answer", data.id, {
    issue_id: issue.id,
    previous: previous ?? null,
  });
  done("Answer submitted for review.");
}
