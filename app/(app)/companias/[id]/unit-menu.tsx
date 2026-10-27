"use client";

import { Menu } from "@base-ui/react/menu";
import { useState } from "react";
import { NAV_ICONS } from "@/components/icons";
import { DeactivateModal } from "@/components/org/deactivate-dialog";
import { buttonClass } from "@/components/ui/button-class";
import { NewUnitDialog } from "./new-unit";

const { Ellipsis } = NAV_ICONS;

export function UnitMenu({
  companyId,
  level,
  id,
  name,
  active,
  canCreate,
  canManage,
  disabledReason,
}: {
  companyId: string;
  level: "site" | "store";
  id: string;
  name: string;
  active: boolean;
  canCreate: boolean;
  canManage: boolean;
  disabledReason?: string;
}) {
  const [dialog, setDialog] = useState<"store" | "toggle">();
  const close = () => setDialog(undefined);
  const mode = active ? "deactivate" : "reactivate";
  const verb = active ? "Desactivar" : "Reactivar";
  const noun = level === "site" ? "sede" : "tienda";
  const hintId = `perm-${id}`;

  return (
    <>
      <Menu.Root>
        <Menu.Trigger className={buttonClass("icon", "sm")} aria-label={`Acciones de ${name}`} title={`Acciones de ${name}`}>
          <Ellipsis aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="ui-positioner" align="end" sideOffset={8}>
            <Menu.Popup className="menu-popup" aria-label={`Acciones de ${name}`}>
              {canCreate && level === "site" && (
                <Menu.Item className="menu-item" onClick={() => setDialog("store")}>
                  Nueva tienda
                </Menu.Item>
              )}
              <Menu.Item
                className="menu-item"
                disabled={!canManage}
                aria-describedby={!canManage ? hintId : undefined}
                onClick={() => setDialog("toggle")}
              >
                {verb} {noun}
              </Menu.Item>
              {!canManage && disabledReason && (
                <p className="hint menu-hint" id={hintId}>
                  {disabledReason}
                </p>
              )}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      {dialog === "store" && <NewUnitDialog companyId={companyId} siteId={id} siteName={name} onClose={close} />}
      {dialog === "toggle" && <DeactivateModal level={level} id={id} name={name} mode={mode} onClose={close} />}
    </>
  );
}
