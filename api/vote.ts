export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured on server" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      // body is already parsed or invalid
    }
  }

  const { profile_id, position_id, candidate_ids } = body || {};
  if (!profile_id || !position_id) {
    return res.status(400).json({ error: "Missing required fields: profile_id or position_id" });
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    // Delete previous votes for this post
    await fetch(
      `https://movhilslxqbpzghykqty.supabase.co/rest/v1/student_votes?profile_id=eq.${profile_id}&position_id=eq.${position_id}`,
      { method: "DELETE", headers }
    );

    // Insert new votes
    if (Array.isArray(candidate_ids) && candidate_ids.length > 0) {
      const rows = candidate_ids.map((cid: string) => ({
        profile_id,
        position_id,
        candidate_id: cid,
        updated_at: new Date().toISOString(),
      }));

      const postRes = await fetch(
        `https://movhilslxqbpzghykqty.supabase.co/rest/v1/student_votes`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(rows),
        }
      );

      if (!postRes.ok) {
        const text = await postRes.text();
        return res.status(500).json({ error: text });
      }
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
