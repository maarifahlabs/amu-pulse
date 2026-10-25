export default async function handler(req: any, res: any) {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  const profileId = req.query?.profile_id;
  if (!serviceKey || !profileId) {
    return res.status(200).json([]);
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  try {
    const fetchRes = await fetch(
      `https://movhilslxqbpzghykqty.supabase.co/rest/v1/student_votes?select=candidate_id&profile_id=eq.${profileId}`,
      { headers }
    );
    const data = await fetchRes.json();
    return res.status(200).json(Array.isArray(data) ? data : []);
  } catch {
    return res.status(200).json([]);
  }
}
