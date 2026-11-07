"use client";

import { useCallback, useEffect, useState } from "react";
import { countUnreadAction } from "@/app/(app)/notificaciones/actions";

const POLL_MS = 60_000;

/** Unread counter kept fresh by polling while the tab is visible. Swap the body for realtime later. */
export function useUnreadCount(initial: number) {
  const [count, setCount] = useState(initial);
  const refresh = useCallback(() => countUnreadAction().then(setCount, () => {}), []);
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && void refresh();
    const id = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);
  return { count, setCount, refresh };
}
