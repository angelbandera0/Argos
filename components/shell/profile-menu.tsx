"use client";

import { Menu } from "@base-ui/react/menu";
import Link from "next/link";
import { signOut } from "@/app/(app)/actions";
import { NAV_ICONS } from "@/components/icons";
import { initials, profileSubtitle } from "./initials";

const { ChevronDown, LogOut, User } = NAV_ICONS;

export function ProfileMenu({ name, role, handle }: { name: string; role: string; handle: string | null }) {
  return (
    <div className="profile">
      <Menu.Root>
        <Menu.Trigger className="profile-btn" aria-label={`Perfil de ${name}`}>
          <span className="avatar" aria-hidden="true">
            {initials(name)}
          </span>
          <span className="who">
            <strong>{name}</strong>
            <span className="caption">{role}</span>
          </span>
          <ChevronDown aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="ui-positioner" align="end" sideOffset={8}>
            <Menu.Popup className="menu-popup" aria-label="Perfil">
              <div className="profile-head">
                <span className="avatar" aria-hidden="true">
                  {initials(name)}
                </span>
                <span className="who">
                  <strong>{name}</strong>
                  <span className="caption">{profileSubtitle(handle, role)}</span>
                </span>
              </div>
              <Menu.Item className="menu-item" render={<Link href="/perfil" />}>
                <User aria-hidden="true" />
                Ver perfil
              </Menu.Item>
              <form action={signOut} role="none">
                <Menu.Item className="menu-item menu-item-danger" closeOnClick={false} nativeButton render={<button type="submit" />}>
                  <LogOut aria-hidden="true" />
                  Cerrar sesión
                </Menu.Item>
              </form>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
