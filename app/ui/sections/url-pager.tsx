import { Suspense } from "react";
import { UrlPager } from "@/components/ui/url-pager";
import { Specimen } from "../gallery";

export function UrlPagerSection() {
  return (
    <Specimen title="Página en el parámetro ?pagina (conserva los demás filtros)">
      <Suspense>
        <UrlPager page={1} pageSize={20} total={65} unit="pedidos" />
      </Suspense>
    </Specimen>
  );
}
