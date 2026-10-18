import type { MetadataRoute } from "next";
import { getDataset } from "@/lib/data";
import { SITE_URL } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ds = await getDataset();
  const staticPaths = ["", "/issues", "/candidates", "/compare", "/election-guide"];
  return [
    ...staticPaths.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...ds.issues.map((i) => ({ url: `${SITE_URL}/issues/${i.slug}` })),
    ...ds.candidates.map((c) => ({ url: `${SITE_URL}/candidates/${c.slug}` })),
  ];
}
