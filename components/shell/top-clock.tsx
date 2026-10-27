"use client";

import { useEffect, useState } from "react";
import { formatClock } from "./format-clock";

export function TopClock() {
  const [text, setText] = useState("");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = new Date();
      setText(formatClock(now));
      timer = setTimeout(tick, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()));
    };
    tick();
    return () => clearTimeout(timer);
  }, []);
  return (
    <span className="clock caption" aria-live="off">
      {text || " "}
    </span>
  );
}
