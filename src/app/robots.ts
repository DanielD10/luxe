import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Keep preview deployments out of search results.
  const production = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  return production
    ? { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/saved"] }], sitemap: `${site.url}/sitemap.xml` }
    : { rules: [{ userAgent: "*", disallow: "/" }] };
}
