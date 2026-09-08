import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yana’s Digital Time Capsule",
    short_name: "Yana Vault",
    description: "A private vault that unlocks at 18, midnight Asia/Manila.",
    start_url: "/",
    display: "standalone",
    background_color: "#07071a",
    theme_color: "#07071a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
