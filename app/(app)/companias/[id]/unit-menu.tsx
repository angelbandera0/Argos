"use client";

import { Menu } from "@base-ui/react/menu";
import { useState } from "react";
import { NAV_ICONS } from "@/components/icons";
import { DeactivateModal } from "@/components/org/deactivate-dialog";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { buttonClass } from "@/components/ui/button-class";
import { type ActionState, renameUnitAction } from "../actions";
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
  canRename = false,
  renameReason,
}: {
  companyId: string;
  level: "site" | "store";
  id: string;
  name: string;
  active: boolean;
  canCreate: boolean;
  canManage: boolean;
  disabledReason?: string;
  canRename?: boolean;
  renameReason?: string;
}) {
  const [dialog, setDialog] = useState<"store" | "toggle" | "rename">();
  const close = () => setDialog(undefined);
  const mode = active ? "deactivate" : "reactivate";
  const verb = active ? "Desactivar" : "Reactivar";
  const noun = level === "site" ? "sede" : "tienda";
  const hintId = `perm-${id}`;
  const renameHintId = `perm-rename-${id}`;

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
                disabled={!canRename}
                aria-describedby={!canRename && renameReason ? renameHintId : undefined}
                onClick={() => setDialog("rename")}
              >
                Renombrar {noun}
              </Menu.Item>
              {!canRename && renameReason && (
                <p className="hint menu-hint" id={renameHintId}>
                  {renameReason}
                </p>
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
      {dialog === "rename" && (
        <FormDialog<ActionState>
          title={`Renombrar ${noun}`}
          description="El cambio queda en el historial."
          size="sm"
          action={(_, formData) => renameUnitAction(level, id, formData)}
          successMessage="Nombre actualizado."
          onClose={close}
        >
          {(state) => (
            <Field label="Nombre" htmlFor={`name-${id}`}>
              <Input
                id={`name-${id}`}
                name="name"
                required
                maxLength={80}
                defaultValue={name}
                aria-invalid={state.error ? true : undefined}
              />
            </Field>
          )}
        </FormDialog>
      )}
      {dialog === "toggle" && <DeactivateModal level={level} id={id} name={name} mode={mode} onClose={close} />}
    </>
  );
}
