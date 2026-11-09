"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, useTransition } from "react";
import { RouteProgress } from "./route-progress";

let active = 0;
const listeners = new Set<() => void>();
const bump = (d: number) => {
  active += d;
  listeners.forEach((l) => l());
};

type Opts = { scroll?: boolean };

/** Router cuyos cambios de URL corren en una transición y muestran la barra de progreso global. */
export function useNavRouter() {
  const router = useRouter();
  const [pending, start] = useTransition();
  useEffect(() => {
    if (!pending) return;
    bump(1);
    return () => bump(-1);
  }, [pending]);
  return {
    replace: (href: string, o?: Opts) => start(() => router.replace(href, o)),
    push: (href: string, o?: Opts) => start(() => router.push(href, o)),
    refresh: () => start(() => router.refresh()),
  };
}

export function NavProgress() {
  const busy = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    () => active > 0,
    () => false,
  );
  return busy ? <RouteProgress delay={0} /> : null;
}
