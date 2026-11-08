"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Saves the browser's time zone in a cookie so pages rendered on the server can show event times
 * in each student's own zone. When the zone changes (first visit, travel), the page refreshes once.
 */
export default function TimeZoneSync() {
  const router = useRouter();
  useEffect(() => {
    let zone = "UTC";
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return;
    }
    const saved = document.cookie.split("; ").find((c) => c.startsWith("tz="));
    if (saved && decodeURIComponent(saved.slice(3)) === zone) return;
    document.cookie = `tz=${encodeURIComponent(zone)}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }, [router]);
  return null;
}
