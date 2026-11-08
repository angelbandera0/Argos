"use client";

import { Menu } from "@base-ui/react/menu";
import Link from "next/link";
import { useState } from "react";
import { deleteCurrencyAction, setCurrencyActiveAction } from "@/app/(app)/divisas/actions";
import { NAV_ICONS, Power } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { buttonClass } from "@/components/ui/button-class";
import { useToast } from "@/components/ui/toast";

const { Ellipsis, Trash2, Settings } = NAV_ICONS;

type Pending = "toggle" | "delete" | null;

export function CurrencyMenu({ id, name, active }: { id: string; name: string; active: boolean }) {
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const close = () => setPending(null);
  const ask = (p: Pending) => {
    setError(undefined);
    setPending(p);
  };

  async function confirm() {
    setBusy(true);
    const r = pending === "delete" ? await deleteCurrencyAction(id) : await setCurrencyActiveAction(id, !active);
    setBusy(false);
    if (r.error) return setError(r.error);
    toast.success(pending === "delete" ? "Divisa eliminada" : active ? "Divisa desactivada" : "Divisa reactivada");
    close();
  }

  const deleting = pending === "delete";
  return (
    <>
      <Menu.Root>
        <Menu.Trigger className={buttonClass("icon", "sm")} aria-label={`Opciones de ${name}`} title={`Opciones de ${name}`}>
          <Ellipsis aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="ui-positioner" align="end" sideOffset={8}>
            <Menu.Popup className="menu-popup" aria-label={`Opciones de ${name}`}>
              <Menu.Group>
                <Menu.GroupLabel className="eyebrow">Divisa</Menu.GroupLabel>
                <Menu.Item className="menu-item" render={<Link href={`/divisas/${id}`} />}>
                  <Settings aria-hidden="true" />
                  Editar
                </Menu.Item>
                <Menu.Item className="menu-item" onClick={() => ask("toggle")}>
                  <Power aria-hidden="true" />
                  {active ? "Desactivar" : "Reactivar"}
                </Menu.Item>
                <Menu.Item className="menu-item menu-item-danger" onClick={() => ask("delete")}>
                  <Trash2 aria-hidden="true" />
                  Eliminar
                </Menu.Item>
              </Menu.Group>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <AlertDialog
        open={pending !== null}
        onClose={close}
        onConfirm={confirm}
        loading={busy}
        loadingLabel="Procesando…"
        tone={deleting || active ? "danger" : "warning"}
        icon={deleting ? "Trash2" : "Settings"}
        confirmLabel={deleting ? "Eliminar divisa" : active ? "Desactivar divisa" : "Reactivar divisa"}
        title={deleting ? `¿Eliminar ${name}?` : active ? `¿Desactivar ${name}?` : `¿Reactivar ${name}?`}
      >
        <p className="muted">
          {deleting
            ? "La divisa dejará de aparecer en tu lista. Si ya tiene datos asociados, no se podrá eliminar."
            : active
              ? "Ya no se ofrecerá en pedidos nuevos. Los pedidos, lotes y costos que ya la usan no cambian y se siguen viendo con su formato."
              : "La divisa volverá a ofrecerse en pedidos nuevos."}
        </p>
        {error && <Alert variant="danger">{error}</Alert>}
      </AlertDialog>
    </>
  );
}
