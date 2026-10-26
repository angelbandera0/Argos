"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/(app)/actions";
import { NAV_ICONS } from "@/components/icons";
import { initials } from "./initials";

export function ProfileMenu({ name, role }: { name: string; role: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const Chevron = NAV_ICONS.ChevronDown;
  const LogOut = NAV_ICONS.LogOut;

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      close();
      return;
    }
    const items = [...(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    if (!open || items.length === 0) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const move = { ArrowDown: (i + 1) % items.length, ArrowUp: (i - 1 + items.length) % items.length, Home: 0, End: items.length - 1 }[e.key];
    if (move === undefined) return;
    e.preventDefault();
    items[move].focus();
  };

  return (
    <div className="profile" ref={root} onKeyDown={onKeyDown}>
      <button
        ref={button}
        type="button"
        className="profile-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="profile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar" aria-hidden="true">
          {initials(name)}
        </span>
        <span className="who">
          <strong>{name}</strong>
          <span className="caption">{role}</span>
        </span>
        <Chevron aria-hidden="true" />
      </button>
      {open && (
        <div id="profile-menu" className="profile-menu" role="menu" aria-label="Perfil">
          <form action={signOut} role="none">
            <button type="submit" role="menuitem" className="profile-item">
              <LogOut aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
