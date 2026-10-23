"use server";

import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { audit, requireUser } from "@/lib/auth";
import { messageHref } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { voteLimit } from "@/lib/voting";

const VOTE = "/vote";

function fail(message: string): never {
  redirect(messageHref(VOTE, "error", message));
}

export async function saveVote(formData: FormData) {
  const viewer = await requireUser(VOTE);
  const positionId = String(formData.get("positionId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(positionId)) fail("Choose a post from the list.");

  const ids = [...new Set(formData.getAll("candidateId").filter((value): value is string => typeof value === "string" && value.length > 0))];
  if (ids.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) fail("Choose candidates from the list.");

  const db = createAdminClient();
  const positionQuery = db.from("positions").select("id, slug, title").eq("id", positionId).maybeSingle();
  const candidateQuery = ids.length === 0
    ? Promise.resolve({ data: [] as { id: string; position_id: string }[], error: null })
    : db.from("candidates").select("id, position_id").in("id", ids).eq("verification_status", "verified");
  const [{ data: position }, { data, error }] = await Promise.all([positionQuery, candidateQuery]);
  if (!position) fail("Choose a post from the list.");
  const title = position.title || "this post";
  if (ids.length === 0) fail(`Choose a candidate for ${title} before submitting.`);
  if (error || !data || data.length !== ids.length || data.some((row) => row.position_id !== positionId)) {
    fail("Choose candidates from this post.");
  }

  const limit = voteLimit(position.slug);
  if (data.length > limit) {
    fail(limit === 1 ? `Choose only 1 candidate for ${title}.` : `Choose up to ${limit} candidates for ${title}.`);
  }

  const { error: deleteError } = await db
    .from("student_votes")
    .delete()
    .eq("profile_id", viewer.id)
    .eq("position_id", positionId);
  if (deleteError) fail("Could not save your vote. If this is the first time, run the student votes SQL in Supabase.");

  const { error: insertError } = await db.from("student_votes").insert(
    data.map((row) => ({
      profile_id: viewer.id,
      candidate_id: row.id,
      position_id: positionId,
      updated_at: new Date().toISOString(),
    })),
  );
  if (insertError) fail("Could not save your vote.");

  const savedCount = data.length;
  after(async () => {
    revalidateTag("vote-counts", { expire: 0 });
    await audit(viewer.id, "vote.save", "profile", viewer.id, { position_id: positionId, count: savedCount });
  });
  redirect(`${messageHref(VOTE, "ok", `Your vote for ${title} was saved. You can submit each post on its own.`)}#post-${positionId}`);
}
