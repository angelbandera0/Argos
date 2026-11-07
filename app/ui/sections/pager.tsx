"use client";

import { useState } from "react";
import { Pager } from "@/components/ui/pager";
import { Specimen } from "../gallery";

export function PagerSection() {
  const [page, setPage] = useState(2);
  return (
    <Specimen title="Anterior · páginas · Siguiente">
      <Pager page={page} pageSize={6} total={20} onPageChange={setPage} />
    </Specimen>
  );
}
