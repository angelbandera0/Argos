"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const formats = {
  datetime: new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "medium" }),
  time: new Intl.DateTimeFormat("es", { timeStyle: "medium", hourCycle: "h23" }),
};

/** Formats in the browser's time zone; the server render leaves it empty to avoid a mismatch. */
export function LocalDateTime({ value, mode = "datetime" }: { value: string; mode?: "datetime" | "time" }) {
  const text = useSyncExternalStore(subscribe, () => formats[mode].format(new Date(value)), () => "");
  return (
    <time className="tabular" dateTime={value}>
      {text || " "}
    </time>
  );
}
