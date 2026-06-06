import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pawscriptions",
    short_name: "Pawscriptions",
    description: "Track the dog's medications and never miss a dose.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0d9488",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
