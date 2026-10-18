import type { MetadataRoute } from "next";
import { getDataset } from "@/lib/data";
import { absoluteUrl } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ds = await getDataset();
  const staticPaths = ["", "/issues", "/candidates", "/compare", "/election-guide"];
  return [
    ...staticPaths.map((path) => ({ url: absoluteUrl(path || "/") })),
    ...ds.issues.map((i) => ({ url: absoluteUrl(`/issues/${i.slug}`) })),
    ...ds.candidates.map((c) => ({ url: absoluteUrl(`/candidates/${c.slug}`) })),
  ];
}
