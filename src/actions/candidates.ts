"use server";

import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { audit, requireViewer } from "@/lib/auth";
import { joinedField, messageHref } from "@/lib/format";
import { sendClaimNotice } from "@/lib/mail";
import { uploadCandidatePhoto } from "@/lib/photos";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  answerSchema, claimSchema, createProfileSchema, firstError, formToObject, manifestoSchema, profileUpdateSchema, slugify,
} from "@/lib/validations";

const DASHBOARD = "/candidate/dashboard";
const CLAIM = "/claim";
const CREATE = "/create";

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
    .select("id, slug, verification_status")
    .eq("profile_id", viewer.id)
    .maybeSingle();
  if (!candidate) fail("Your account is not linked to a candidate profile yet.");
  return { viewer, candidate };
}

function createFail(message: string): never {
  redirect(messageHref(CREATE, "error", message));
}

export async function createCandidateProfile(formData: FormData) {
  const viewer = await requireViewer(CREATE);
  const parsed = createProfileSchema.safeParse(formToObject(formData));
  if (!parsed.success) createFail(firstError(parsed.error));

  const db = createAdminClient();
  const base = slugify(parsed.data.name) || "candidate";
  const candidateId = crypto.randomUUID();
  let photoUrl: string | null = null;
  let existing: { id: string } | null = null;
  let pending: { id: string } | null = null;
  let position: { id: string } | null = null;
  let taken: { slug: string }[] | null = null;
  try {
    [{ data: existing }, { data: pending }, { data: position }, { data: taken }, photoUrl] = await Promise.all([
      db.from("candidates").select("id").eq("profile_id", viewer.id).maybeSingle(),
      db.from("candidate_claims").select("id").eq("profile_id", viewer.id).eq("status", "pending").maybeSingle(),
      db.from("positions").select("id").eq("id", parsed.data.positionId).maybeSingle(),
      db.from("candidates").select("slug").like("slug", `${base}%`),
      uploadCandidatePhoto(db, candidateId, formData.get("photo")),
    ]);
  } catch (err) {
    createFail(err instanceof Error ? err.message : "Photo upload failed.");
  }
  if (existing) createFail("This account already has a profile. Open your account to edit it.");
  if (pending) createFail("You already have a claim waiting for review. Open that candidate's page if you meant to claim an existing profile.");
  if (!position) createFail("Choose a post from the list.");

  const used = new Set((taken ?? []).map((row) => row.slug));
  let slug = base;
  for (let i = 2; used.has(slug) && i < 30; i += 1) slug = `${base}-${i}`;

  const { error } = await db.from("candidates").insert({
    id: candidateId,
    slug,
    profile_id: viewer.id,
    position_id: parsed.data.positionId,
    name: parsed.data.name,
    department: parsed.data.department,
    faculty: parsed.data.faculty,
    bio: parsed.data.bio,
    photo_url: photoUrl,
    verification_status: "verified",
  });
  if (error) createFail("Could not create your profile.");

  await db.from("profiles").update({
    display_name: parsed.data.name,
    ...(viewer.role === "student" ? { role: "candidate" } : {}),
  }).eq("id", viewer.id);

  after(async () => {
    revalidateTag("public-dataset", { expire: 0 });
    await audit(viewer.id, "profile.create", "candidate", candidateId);
  });
  redirect(messageHref(DASHBOARD, "ok", "Your profile is live. You can add a photo and manifesto below."));
}

function claimFail(slug: string, message: string): never {
  const path = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ? `/claim/${slug}` : CLAIM;
  redirect(messageHref(path, "error", message));
}

export async function submitClaim(formData: FormData) {
  const viewer = await requireViewer(CLAIM);
  const raw = formToObject(formData);
  const parsed = claimSchema.safeParse(raw);
  if (!parsed.success) claimFail(raw.slug ?? "", firstError(parsed.error));

  const db = createAdminClient();
  const { data: candidate } = await db
    .from("candidates")
    .select("id, slug, name, ballot_number, profile_id, positions(title)")
    .eq("id", parsed.data.candidateId)
    .maybeSingle();
  if (!candidate || candidate.slug !== parsed.data.slug) claimFail(parsed.data.slug, "Candidate not found.");
  if (candidate.profile_id) claimFail(candidate.slug, "This profile has already been claimed. Contact the moderators if this is wrong.");

  const { data: existing } = await db
    .from("candidate_claims")
    .select("id, candidate_id")
    .eq("profile_id", viewer.id)
    .eq("status", "pending")
    .maybeSingle();
  if (existing && existing.candidate_id !== candidate.id) {
    claimFail(candidate.slug, "You already have a claim awaiting review. Wait for that decision before claiming another profile.");
  }

  const evidence = `Email: ${parsed.data.email}\nPhone: ${parsed.data.phone}\nProof of candidacy:\n${parsed.data.proof}`;
  const { data, error } = await db
    .from("candidate_claims")
    .upsert(
      { candidate_id: candidate.id, profile_id: viewer.id, evidence, status: "pending" },
      { onConflict: "candidate_id,profile_id" },
    )
    .select("id")
    .single();
  if (error) claimFail(candidate.slug, "Could not submit your claim.");

  await audit(viewer.id, "claim.submit", "candidate_claim", data.id, { candidate_id: candidate.id });
  const mailed = await sendClaimNotice({
    candidateName: candidate.name,
    post: joinedField(candidate.positions, "title"),
    serial: candidate.ballot_number == null ? "" : String(candidate.ballot_number).padStart(2, "0"),
    slug: candidate.slug,
    accountEmail: viewer.email ?? "",
    contactEmail: parsed.data.email,
    phone: parsed.data.phone,
    proof: parsed.data.proof,
  });
  const message = mailed
    ? "Verification submitted. Your details were emailed for review. You can edit the profile after it is approved."
    : "Verification submitted. A moderator will review your details. You can edit the profile after it is approved.";
  redirect(messageHref(CLAIM, "ok", message));
}

export async function submitProfileUpdate(formData: FormData) {
  const { viewer, candidate } = await requireLinkedCandidate();
  const parsed = profileUpdateSchema.safeParse(formToObject(formData));
  if (!parsed.success) fail(firstError(parsed.error));

  const db = createAdminClient();
  let photoPendingUrl: string | null = null;
  try {
    photoPendingUrl = await uploadCandidatePhoto(db, candidate.id, formData.get("photo"));
  } catch (err) {
    fail(err instanceof Error ? err.message : "Photo upload failed.");
  }

  const { error } = await db
    .from("candidates")
    .update({
      bio: parsed.data.bio,
      bio_pending: null,
      ...(photoPendingUrl ? { photo_url: photoPendingUrl, photo_pending_url: null } : {}),
      profile_update_status: null,
    })
    .eq("id", candidate.id);
  if (error) fail("Could not save your profile.");

  revalidateTag("public-dataset", { expire: 0 });
  await audit(viewer.id, "profile.submit", "candidate", candidate.id, { photo: Boolean(photoPendingUrl) });
  done("Bio saved.");
}

export async function submitManifesto(formData: FormData) {
  const { viewer, candidate } = await requireLinkedCandidate();
  const parsed = manifestoSchema.safeParse(formToObject(formData));
  if (!parsed.success) fail(firstError(parsed.error));

  const db = createAdminClient();
  const now = new Date().toISOString();
  const row = {
    content: parsed.data.content,
    source_url: parsed.data.sourceUrl,
    status: "published" as const,
    submitted_at: now,
    published_at: now,
  };
  const { data: latest } = await db
    .from("manifestos")
    .select("id")
    .eq("candidate_id", candidate.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const saved = latest
    ? await db.from("manifestos").update(row).eq("id", latest.id).select("id").single()
    : await db.from("manifestos").insert({ candidate_id: candidate.id, ...row }).select("id").single();
  if (saved.error || !saved.data) fail("Could not save your manifesto.");

  await db.from("manifestos").delete().eq("candidate_id", candidate.id).eq("status", "pending");
  revalidateTag("public-dataset", { expire: 0 });
  await audit(viewer.id, "manifesto.submit", "manifesto", saved.data.id);
  done("Manifesto saved.");
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
