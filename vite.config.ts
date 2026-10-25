import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

function devVotingPlugin(serviceKey?: string) {
  return {
    name: "dev-voting-plugin",
    configureServer(server: any) {
      const headers = {
        apikey: serviceKey || "",
        Authorization: `Bearer ${serviceKey || ""}`,
        "Content-Type": "application/json",
      };

      // 1. Dev voting endpoint (exact same dynamic behavior as Next.js server actions)
      server.middlewares.use("/api/vote", async (req: any, res: any) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end();
        }
        let body = "";
        req.on("data", (chunk: any) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const { profile_id, position_id, candidate_ids } = JSON.parse(body);
            if (!serviceKey) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: "SERVICE_KEY missing" }));
            }

            // Delete previous votes for this position
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
              await fetch(`https://movhilslxqbpzghykqty.supabase.co/rest/v1/student_votes`, {
                method: "POST",
                headers,
                body: JSON.stringify(rows),
              });
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });

      // 2. Dev read personal votes endpoint
      server.middlewares.use("/api/my-votes", async (req: any, res: any) => {
        try {
          const urlObj = new URL(req.url, "http://localhost");
          const profileId = urlObj.searchParams.get("profile_id");
          if (!profileId || !serviceKey) {
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify([]));
          }
          const fetchRes = await fetch(
            `https://movhilslxqbpzghykqty.supabase.co/rest/v1/student_votes?select=candidate_id&profile_id=eq.${profileId}`,
            { headers }
          );
          const data = await fetchRes.json();
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(Array.isArray(data) ? data : []));
        } catch {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify([]));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isVercel = Boolean(process.env.VERCEL);
  const base = env.VITE_BASE_PATH ?? (isVercel ? "/" : process.env.GITHUB_ACTIONS ? "/amu-pulse/" : "/");

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      devVotingPlugin(serviceKey),
    ],
    define: {
      "process.env": {},
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
