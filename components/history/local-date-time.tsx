"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const format = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "medium" });

/** Formats in the browser's time zone; the server render leaves it empty to avoid a mismatch. */
export function LocalDateTime({ value }: { value: string }) {
  const text = useSyncExternalStore(subscribe, () => format.format(new Date(value)), () => "");
  return (
    <time className="tabular" dateTime={value}>
      {text || " "}
    </time>
  );
}
