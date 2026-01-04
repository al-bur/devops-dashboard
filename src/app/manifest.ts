import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DevOps Dashboard",
    short_name: "DevOps",
    description:
      "Monitor all your projects in one place - Vercel, GitHub Actions, Supabase",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0B",
    theme_color: "#10B981",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
