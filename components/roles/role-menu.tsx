"use client";

import { Menu } from "@base-ui/react/menu";
import { useState } from "react";
import { NAV_ICONS } from "@/components/icons";
import { buttonClass } from "@/components/ui/button-class";
import { DeleteRoleDialog } from "./delete-role-dialog";

const { Ellipsis, Trash2 } = NAV_ICONS;

export function RoleMenu({ roleId, name }: { roleId: string; name: string }) {
  const [open, setOpen] = useState(false);
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
                <Menu.GroupLabel className="eyebrow">Rol</Menu.GroupLabel>
                <Menu.Item className="menu-item menu-item-danger" onClick={() => setOpen(true)}>
                  <Trash2 aria-hidden="true" />
                  Eliminar rol
                </Menu.Item>
              </Menu.Group>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <DeleteRoleDialog roleId={roleId} name={name} open={open} onOpenChange={setOpen} />
    </>
  );
}
