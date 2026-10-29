export const MAX_DESCRIPTION = 500;
export const WARN_FROM = 450;

export type NameStatus = "empty" | "checking" | "ok" | "taken";

export const blankProduct = () => ({ name: "", categoryId: "", description: "", active: true });

export const wantsAnother = (v: FormDataEntryValue | null) => v === "1";

export function descriptionCounter(length: number) {
  return { text: `${length} / ${MAX_DESCRIPTION}`, warn: length >= WARN_FROM };
}

export function nameMessage(status: NameStatus, touched: boolean) {
  if (status === "taken") return "Ya existe un producto con ese nombre.";
  if (status === "empty" && touched) return "Escribe el nombre del producto.";
  return undefined;
}

export function productChecklist({ nameStatus, hasCategory }: { nameStatus: NameStatus; hasCategory: boolean }) {
  const items = [
    { state: nameStatus === "ok" ? ("ok" as const) : ("todo" as const), label: "Nombre único" },
    { state: hasCategory ? ("ok" as const) : ("todo" as const), label: "Categoría elegida" },
  ];
  return { items, complete: items.every((i) => i.state === "ok") };
}

export function nameStatusOf(name: string, savedName: string | null, checked: { name: string; available: boolean } | null): NameStatus {
  if (!name) return "empty";
  if (savedName !== null && name === savedName) return "ok";
  if (checked?.name !== name) return "checking";
  return checked.available ? "ok" : "taken";
}
