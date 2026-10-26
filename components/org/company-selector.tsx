"use client";

import { useTransition } from "react";
import { setActiveCompanyAction } from "@/app/(app)/companias/actions";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";

export function CompanySelector({
  companies,
  activeId,
}: {
  companies: { id: string; name: string }[];
  activeId?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Field label="Compañía activa" htmlFor="active-company">
      <Select
        id="active-company"
        options={companies.map((c) => ({ value: c.id, label: c.name }))}
        placeholder="Elige una compañía"
        value={activeId ?? null}
        disabled={pending}
        onValueChange={(v) => v && start(() => setActiveCompanyAction(v))}
      />
    </Field>
  );
}
