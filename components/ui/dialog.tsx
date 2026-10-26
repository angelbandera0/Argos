"use client";

import { useEffect, useRef } from "react";

export function Dialog({
  open,
  title,
  onClose,
  dismissible = true,
  children,
}: {
  open: boolean;
  title: string;
  onClose?: () => void;
  dismissible?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        if (!dismissible) e.preventDefault();
      }}
      onClose={onClose}
    >
      <div className="modal-body">
        <h2 className="h2" id="dialog-title">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
