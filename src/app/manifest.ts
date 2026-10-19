import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LUXE · Places worth the flight",
    short_name: "LUXE",
    description: "Luxury travel, imagery first.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d1113",
    theme_color: "#0d1113",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
