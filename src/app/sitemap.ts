import type { MetadataRoute } from "next";
import { getDataset } from "@/lib/data";
import { absoluteUrl } from "@/lib/env";

export const revalidate = 3600;

/** Public sitemap host. Pages are also served on amu-pulse.maarifahlabs.com. */
const SITEMAP_HOST = "amupulse.maarifahlabs.com";

function sitemapUrl(path: string) {
  const url = new URL(absoluteUrl(path));
  if (url.hostname === "amu-pulse.maarifahlabs.com") url.hostname = SITEMAP_HOST;
  return url.toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ds = await getDataset();
  const staticPaths = ["", "/about", "/issues", "/candidates", "/compare", "/election-guide", "/contact", "/claim"];
  const now = new Date();
  return [
    ...staticPaths.map((path, index) => ({
      url: sitemapUrl(path || "/"),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: index === 0 ? 1 : 0.8,
    })),
    ...ds.issues.map((i) => ({ url: sitemapUrl(`/issues/${i.slug}`) })),
    ...ds.candidates.map((c) => ({ url: sitemapUrl(`/candidates/${c.slug}`) })),
  ];
}
