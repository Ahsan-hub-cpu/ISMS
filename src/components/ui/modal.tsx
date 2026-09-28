"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Wider dialog for denser forms. */
  size?: "md" | "lg";
  footer?: ReactNode;
}

/**
 * Overlay dialog for create/edit flows. Portalled to document.body so it is never
 * trapped inside a table cell / overflow container (which breaks typing in textareas).
 */
export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  footer,
}: ModalProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Parents pass inline `() => setOpen(false)`; keep a stable ref so the open
  // effect does not re-run (and steal focus) on every keystroke re-render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    // Focus once when the dialog opens — never again while the user is typing.
    const focusTimer = window.setTimeout(() => {
      const root = panelRef.current;
      if (!root) return;
      if (root.contains(document.activeElement)) return;

      const preferred =
        root.querySelector<HTMLElement>(
          "textarea, input:not([type=hidden]):not([type=date])",
        ) ??
        root.querySelector<HTMLElement>(
          "input:not([type=hidden]), select, button:not([data-close])",
        );

      preferred?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
      <div
        aria-hidden
        className="animate-overlay-in absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={() => onCloseRef.current()}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "animate-dialog-in relative z-10 my-auto flex w-full flex-col overflow-hidden",
          "rounded-2xl border border-surface-border bg-surface-raised shadow-[var(--shadow-modal)]",
          "max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]",
          size === "lg" ? "max-w-2xl" : "max-w-lg",
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-surface-border px-6 pb-4 pt-5">
          <div className="min-w-0 space-y-1">
            <h2
              id={titleId}
              className="font-display text-lg font-semibold tracking-tight text-content"
            >
              {title}
            </h2>
            {description ? (
              <p className="text-[0.8125rem] leading-relaxed text-content-muted">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            data-close
            onClick={() => onCloseRef.current()}
            aria-label="Close"
            className="-mr-1.5 -mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-content-subtle transition-colors hover:bg-surface-sunken hover:text-content"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-surface-border bg-surface-sunken/60 px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};
