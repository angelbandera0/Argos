"use client";

import { useMemo } from "react";
import { Toast } from "@base-ui/react/toast";
import { NAV_ICONS } from "@/components/icons";
import { TONE_ICON, TOAST_LIMIT, toastTimeout, type Tone } from "./feedback-utils";

export type ToastOptions = { description?: string; action?: { label: string; onClick: () => void } };

function Toasts() {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport className="toast-viewport" aria-label="Notificaciones">
        {toasts.map((t) => {
          const tone = (t.type as Tone | undefined) ?? "info";
          const Icon = NAV_ICONS[TONE_ICON[tone]];
          return (
            <Toast.Root key={t.id} toast={t} className={`toast tone-${tone}`}>
              <Toast.Content className="toast-content">
                <span className="icon-circle icon-circle-toast" aria-hidden="true">
                  <Icon />
                </span>
                <div className="toast-text">
                  <Toast.Title className="toast-title" />
                  <Toast.Description className="toast-desc" />
                  {t.actionProps && <Toast.Action className="btn btn-ghost btn-sm toast-action" />}
                </div>
                <Toast.Close className="close-btn close-btn-sm" aria-label="Cerrar notificación">
                  <NAV_ICONS.X aria-hidden="true" />
                </Toast.Close>
              </Toast.Content>
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider limit={TOAST_LIMIT}>
      {children}
      <Toasts />
    </Toast.Provider>
  );
}

export function useToast() {
  const { add, close } = Toast.useToastManager();
  return useMemo(() => {
    const show = (tone: Tone) => (title: string, o: ToastOptions = {}) =>
      add({
        title,
        description: o.description,
        type: tone,
        timeout: toastTimeout(tone),
        priority: tone === "danger" ? "high" : "low",
        actionProps: o.action && { children: o.action.label, onClick: o.action.onClick },
      });
    return { success: show("success"), info: show("info"), warning: show("warning"), error: show("danger"), close };
  }, [add, close]);
}
