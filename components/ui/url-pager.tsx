"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pager } from "./pager";

/** Pager that keeps the page in the `pagina` URL param, preserving the other filters. */
export function UrlPager({ page, pageSize, total, unit }: { page: number; pageSize: number; total: number; unit?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const go = (n: number) => {
    const next = new URLSearchParams(params.toString());
    if (n <= 1) next.delete("pagina");
    else next.set("pagina", String(n));
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  return <Pager page={page} pageSize={pageSize} total={total} unit={unit} onPageChange={go} />;
}
