"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Keeps the `tz` cookie equal to the browser's zone so the server can cut calendar days in it; refreshes once when it changes. */
export function TimeZoneSync() {
  const router = useRouter();
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const current = document.cookie.split("; ").find((c) => c.startsWith("tz="))?.slice(3);
    if (!tz || (current && decodeURIComponent(current) === tz)) return;
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);
  return null;
}
