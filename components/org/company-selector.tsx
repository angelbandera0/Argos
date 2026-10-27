"use client";

import { Menu } from "@base-ui/react/menu";
import { Check, ChevronsUpDown, Settings2 } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { setActiveCompanyAction } from "@/app/(app)/companias/actions";
import { avatarTone, companyInitials } from "./company-avatar";

export type CompanyOption = { id: string; name: string; code: string };
export type CompanySelectorProps = { companies: CompanyOption[]; activeId?: string };

function Avatar({ company }: { company: CompanyOption }) {
  return (
    <span className={`co-avatar co-tone-${avatarTone(company.code)}`} aria-hidden="true">
      {companyInitials(company.name)}
    </span>
  );
}

export function CompanySelector({
  companies,
  activeId,
  variant = "side",
}: CompanySelectorProps & { variant?: "side" | "bar" }) {
  const [pending, start] = useTransition();
  if (companies.length === 0) return null;
  const active = companies.find((c) => c.id === activeId);
  const label = active ? `Compañía activa: ${active.name}` : "Elegir compañía";
  return (
    <div className={`company company-${variant}`}>
      <Menu.Root>
        <Menu.Trigger className="company-btn" aria-label={label} title={label} disabled={pending}>
          {active ? <Avatar company={active} /> : <span className="co-avatar co-tone-none" aria-hidden="true">?</span>}
          <span className="company-text">
            <span className="eyebrow">Compañía activa</span>
            <strong>{active?.name ?? "Elige una"}</strong>
          </span>
          <ChevronsUpDown className="company-chevron" aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="ui-positioner" align="start" sideOffset={8}>
            <Menu.Popup className="menu-popup company-popup" aria-label="Cambiar compañía">
              <Menu.RadioGroup value={activeId ?? ""} onValueChange={(v) => v && start(() => setActiveCompanyAction(String(v)))}>
                <Menu.GroupLabel className="eyebrow company-label">Cambiar compañía</Menu.GroupLabel>
                {companies.map((c) => (
                  <Menu.RadioItem key={c.id} value={c.id} className="menu-item company-item">
                    <Avatar company={c} />
                    <span className="who">
                      <strong>{c.name}</strong>
                      <span className="company-code">{c.code}</span>
                    </span>
                    <Menu.RadioItemIndicator className="company-check">
                      <Check aria-hidden="true" />
                    </Menu.RadioItemIndicator>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
              <div className="menu-sep" role="separator" />
              <Menu.Item className="menu-item" render={<Link href="/companias" />}>
                <Settings2 aria-hidden="true" />
                Gestionar compañías
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
