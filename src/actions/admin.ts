"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/lib/auth";
import { messageHref } from "@/lib/format";
import { uploadCandidatePhoto } from "@/lib/photos";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  adminCandidateUpdateSchema, candidateSchema, candidateVerificationSchema, eventSchema, firstError, formToObject, issueSchema,
  positionSchema, reviewSchema, uuid,
} from "@/lib/validations";

const DASHBOARD = "/admin/dashboard";

function fail(message: string): never {
  redirect(messageHref(DASHBOARD, "error", message));
}

function done(message: string): never {
  revalidatePath("/", "layout");
  revalidateTag("public-dataset", { expire: 0 });
  redirect(messageHref(DASHBOARD, "ok", message));
}

function parseReview(formData: FormData) {
  const parsed = reviewSchema.safeParse(formToObject(formData));
  if (!parsed.success) fail(firstError(parsed.error));
  return parsed.data;
}

export async function reviewClaim(formData: FormData) {
  const admin = await requireAdmin();
  const { id, decision } = parseReview(formData);
  const db = createAdminClient();

  const { data: claim } = await db
    .from("candidate_claims")
    .select("id, candidate_id, profile_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!claim || claim.status !== "pending") fail("Claim not found or already reviewed.");

  const reviewed = { reviewed_by: admin.id, reviewed_at: new Date().toISOString() };

  if (decision === "approve") {
    const { data: linked, error } = await db
      .from("candidates")
      .update({ profile_id: claim.profile_id })
      .eq("id", claim.candidate_id)
      .is("profile_id", null)
      .select("id");
    if (error || !linked?.length) fail("Candidate is already claimed or the account is linked elsewhere.");

    await db.from("profiles").update({ role: "candidate" }).eq("id", claim.profile_id).eq("role", "student");
    await db.from("candidate_claims").update({ status: "approved", ...reviewed }).eq("id", claim.id);
    await db
      .from("candidate_claims")
      .update({ status: "rejected", ...reviewed })
      .eq("candidate_id", claim.candidate_id)
      .eq("status", "pending");
  } else {
    await db.from("candidate_claims").update({ status: "rejected", ...reviewed }).eq("id", claim.id);
  }

  await audit(admin.id, `claim.${decision}`, "candidate_claim", claim.id, { candidate_id: claim.candidate_id });
  done(`Claim ${decision === "approve" ? "approved" : "rejected"}.`);
}

export async function reviewProfileUpdate(formData: FormData) {
  const admin = await requireAdmin();
  const { id, decision } = parseReview(formData);
  const db = createAdminClient();

  const { data: c } = await db
    .from("candidates")
    .select("id, bio_pending, photo_pending_url, profile_update_status")
    .eq("id", id)
    .maybeSingle();
  if (!c || c.profile_update_status !== "pending") fail("No pending profile update.");

  const update =
    decision === "approve"
      ? {
          bio: c.bio_pending,
          ...(c.photo_pending_url ? { photo_url: c.photo_pending_url } : {}),
          bio_pending: null,
          photo_pending_url: null,
          profile_update_status: "published",
        }
      : { bio_pending: null, photo_pending_url: null, profile_update_status: "rejected" };

  const { error } = await db.from("candidates").update(update).eq("id", c.id);
  if (error) fail("Could not update the candidate.");

  await audit(admin.id, `profile.${decision}`, "candidate", c.id);
  done(`Profile update ${decision === "approve" ? "published" : "rejected"}.`);
}

export async function reviewManifesto(formData: FormData) {
  const admin = await requireAdmin();
  const { id, decision } = parseReview(formData);
  const db = createAdminClient();

  const update =
    decision === "approve"
      ? { status: "published", published_at: new Date().toISOString() }
      : { status: "rejected" };
  const { data, error } = await db
    .from("manifestos")
    .update(update)
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (error || !data?.length) fail("Manifesto not found or already reviewed.");

  await audit(admin.id, `manifesto.${decision}`, "manifesto", id);
  done(`Manifesto ${decision === "approve" ? "published" : "rejected"}.`);
}

export async function reviewAnswer(formData: FormData) {
  const admin = await requireAdmin();
  const { id, decision } = parseReview(formData);

  const { data, error } = await createAdminClient()
    .from("candidate_answers")
    .update({ status: decision === "approve" ? "published" : "rejected" })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (error || !data?.length) fail("Answer not found or already reviewed.");

  await audit(admin.id, `answer.${decision}`, "candidate_answer", id);
  done(`Answer ${decision === "approve" ? "published" : "rejected"}.`);
}

export async function moderateQuestion(formData: FormData) {
  const admin = await requireAdmin();
  const { id, decision } = parseReview(formData);

  const { data, error } = await createAdminClient()
    .from("questions")
    .update({ moderation_status: decision === "approve" ? "approved" : "rejected" })
    .eq("id", id)
    .eq("moderation_status", "pending")
    .select("id");
  if (error || !data?.length) fail("Question not found or already moderated.");

  await audit(admin.id, `question.${decision}`, "question", id);
  done(`Question ${decision === "approve" ? "approved" : "rejected"}.`);
}

export async function saveIssue(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = issueSchema.safeParse(formToObject(formData));
  if (!parsed.success) fail(firstError(parsed.error));
  const { id, ...fields } = parsed.data;
  const db = createAdminClient();

  let wasPublished = false;
  if (id) {
    const { data: current } = await db.from("issues").select("published_at").eq("id", id).maybeSingle();
    if (!current) fail("Issue not found.");
    wasPublished = current.published_at !== null;
  }
  const row = {
    ...fields,
    ...(fields.status === "published" && !wasPublished ? { published_at: new Date().toISOString() } : {}),
  };
  const result = id
    ? await db.from("issues").update(row).eq("id", id).select("id").single()
    : await db.from("issues").insert(row).select("id").single();
  if (result.error) fail(result.error.code === "23505" ? "That slug is already in use." : "Could not save the issue.");

  await audit(admin.id, id ? "issue.update" : "issue.create", "issue", result.data.id, { status: fields.status });
  done("Issue saved.");
}

export async function createPosition(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = positionSchema.safeParse(formToObject(formData));
  if (!parsed.success) fail(firstError(parsed.error));
  const { sortOrder, ...rest } = parsed.data;

  const { data, error } = await createAdminClient()
    .from("positions")
    .insert({ ...rest, sort_order: sortOrder })
    .select("id")
    .single();
  if (error) fail(error.code === "23505" ? "That slug is already in use." : "Could not create the position.");

  await audit(admin.id, "position.create", "position", data.id);
  done("Position created.");
}

export async function createCandidate(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = candidateSchema.safeParse(formToObject(formData));
  if (!parsed.success) fail(firstError(parsed.error));
  const d = parsed.data;

  const db = createAdminClient();
  const { data, error } = await db
    .from("candidates")
    .insert({
      name: d.name,
      slug: d.slug,
      position_id: d.positionId,
      department: d.department,
      faculty: d.faculty,
      official_source_url: d.officialSourceUrl,
      verification_status: d.verificationStatus,
    })
    .select("id")
    .single();
  if (error) fail(error.code === "23505" ? "That slug is already in use." : "Could not create the candidate.");

  try {
    const photoUrl = await uploadCandidatePhoto(db, data.id, formData.get("photo"));
    if (photoUrl) {
      const { error: photoError } = await db.from("candidates").update({ photo_url: photoUrl }).eq("id", data.id);
      if (photoError) fail("Candidate was added, but the photo could not be saved.");
    }
  } catch (err) {
    fail(err instanceof Error ? err.message : "Candidate was added, but the photo could not be saved.");
  }

  await audit(admin.id, "candidate.create", "candidate", data.id, { verification_status: d.verificationStatus });
  done("Candidate created.");
}

export async function updateCandidate(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = adminCandidateUpdateSchema.safeParse(formToObject(formData));
  if (!parsed.success) fail(firstError(parsed.error));
  const d = parsed.data;
  const db = createAdminClient();

  let photoUrl: string | null = null;
  try {
    photoUrl = await uploadCandidatePhoto(db, d.id, formData.get("photo"));
  } catch (err) {
    fail(err instanceof Error ? err.message : "Photo upload failed.");
  }

  const { error } = await db
    .from("candidates")
    .update({
      name: d.name,
      slug: d.slug,
      position_id: d.positionId,
      department: d.department,
      faculty: d.faculty,
      official_source_url: d.officialSourceUrl,
      verification_status: d.verificationStatus,
      bio: d.bio,
      bio_pending: null,
      ballot_number: d.ballotNumber,
      profile_update_status: null,
      ...(photoUrl ? { photo_url: photoUrl, photo_pending_url: null } : {}),
    })
    .eq("id", d.id);
  if (error) fail(error.code === "23505" ? "That slug or serial number is already used." : "Could not update the candidate.");

  if (d.manifesto) {
    const now = new Date().toISOString();
    const row = { content: d.manifesto, status: "published" as const, submitted_at: now, published_at: now };
    const { data: latest } = await db
      .from("manifestos")
      .select("id")
      .eq("candidate_id", d.id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const saved = latest
      ? await db.from("manifestos").update(row).eq("id", latest.id)
      : await db.from("manifestos").insert({ candidate_id: d.id, ...row });
    if (saved.error) fail("Profile saved, but the manifesto could not be updated.");
  }

  await audit(admin.id, "candidate.update", "candidate", d.id, { photo: Boolean(photoUrl) });
  done("Candidate profile updated.");
}

export async function setCandidateVerification(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = candidateVerificationSchema.safeParse(formToObject(formData));
  if (!parsed.success) fail(firstError(parsed.error));

  const { error } = await createAdminClient()
    .from("candidates")
    .update({ verification_status: parsed.data.verificationStatus })
    .eq("id", parsed.data.id);
  if (error) fail("Could not update verification.");

  await audit(admin.id, "candidate.verification", "candidate", parsed.data.id, { status: parsed.data.verificationStatus });
  done("Verification status updated.");
}

/** datetime-local inputs have no zone; election times are always IST. */
function toIstIso(value: string) {
  const hasZone = /[zZ]|[+-]\d{2}:\d{2}$/.test(value);
  const withSeconds = /T\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
  const date = new Date(hasZone ? value : `${withSeconds}+05:30`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createEvent(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = eventSchema.safeParse(formToObject(formData));
  if (!parsed.success) fail(firstError(parsed.error));
  const startsAt = toIstIso(parsed.data.startsAt);
  if (!startsAt) fail("Invalid date.");

  const { data, error } = await createAdminClient()
    .from("election_events")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      kind: parsed.data.kind,
      starts_at: startsAt,
      source_url: parsed.data.sourceUrl,
    })
    .select("id")
    .single();
  if (error) fail("Could not create the event.");

  await audit(admin.id, "event.create", "election_event", data.id);
  done("Event created. Verify it against the source to publish it.");
}

export async function setEventVerified(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) fail("Invalid event.");
  const verified = formData.get("verified") === "true";

  const { error } = await createAdminClient()
    .from("election_events")
    .update({ verified_at: verified ? new Date().toISOString() : null })
    .eq("id", id.data);
  if (error) fail("Could not update the event.");

  await audit(admin.id, verified ? "event.verify" : "event.unverify", "election_event", id.data);
  done(verified ? "Event verified and published." : "Event unpublished.");
}
