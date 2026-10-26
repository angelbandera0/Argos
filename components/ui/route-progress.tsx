"use client";

import { useEffect, useState } from "react";

export function RouteProgress({ delay = 150 }: { delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!visible) return null;
  return <div className="route-progress" role="progressbar" aria-label="Cargando pantalla" />;
}
