import type { MetadataRoute } from "next";
import { absoluteUrl, BASE_PATH } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const hidden = ["/admin", "/candidate", "/login", "/auth", "/api"].map((path) => `${BASE_PATH}${path}`);
  return {
    rules: { userAgent: "*", allow: BASE_PATH || "/", disallow: hidden },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
