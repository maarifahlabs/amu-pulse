import type { MetadataRoute } from "next";
import { getDataset } from "@/lib/data";
import { absoluteUrl } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ds = await getDataset();
  const staticPaths = ["", "/issues", "/candidates", "/compare", "/election-guide", "/claim"];
  const now = new Date();
  return [
    ...staticPaths.map((path, index) => ({
      url: absoluteUrl(path || "/"),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: index === 0 ? 1 : 0.8,
    })),
    ...ds.issues.map((i) => ({ url: absoluteUrl(`/issues/${i.slug}`) })),
    ...ds.candidates.map((c) => ({ url: absoluteUrl(`/candidates/${c.slug}`) })),
  ];
}
