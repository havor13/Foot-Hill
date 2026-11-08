import type { MetadataRoute } from "next";

/** Lets students add the site to their home screen. iPhones only allow push notifications from an added site. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Foothill Commons",
    short_name: "Foothill",
    description: "A community for BYU students: groups, course circles, alumni connections, events and chat.",
    start_url: "/feed",
    display: "standalone",
    background_color: "#0e6b66",
    theme_color: "#0e6b66",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
