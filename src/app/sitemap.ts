import type { MetadataRoute } from "next";
import { destinations } from "@/lib/destinations";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/destinations`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/plan`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site.url}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site.url}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${site.url}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
  return [
    ...pages,
    ...destinations.map((d) => ({
      url: `${site.url}/destinations/${d.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
