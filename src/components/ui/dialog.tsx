"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  ariaLabel?: string;
}

/**
 * Lightweight modal built on the native `<dialog>` element so focus-trap and
 * Esc handling come for free. Uses an effect to imperatively call
 * `showModal`/`close` whenever `open` changes.
 */
export function Dialog({ open, onClose, children, ariaLabel = "Dialog" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={ariaLabel}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
      }}
      className="rounded-lg bg-white p-0 shadow-2xl backdrop:bg-black/40 open:flex open:flex-col"
    >
      {children}
    </dialog>
  );
}

export function DialogContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
