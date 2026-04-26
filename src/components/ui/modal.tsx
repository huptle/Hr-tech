"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Native <dialog> + showModal() — uses the browser top layer so the panel is not
 * trapped under sticky headers, transformed ancestors, or broken portals (common
 * on LAN / mobile / strict privacy modes).
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handlePointerDownBackdrop = useCallback(
    (e: React.PointerEvent<HTMLDialogElement>) => {
      const el = dialogRef.current;
      if (!el?.open) return;
      const r = el.getBoundingClientRect();
      const { clientX: x, clientY: y } = e;
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  useLayoutEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (isOpen) {
      if (!d.open) d.showModal();
    } else if (d.open) {
      d.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const sync = () => onClose();
    d.addEventListener("close", sync);
    return () => d.removeEventListener("close", sync);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-0 right-0 top-0 z-[2147483647] m-auto max-h-[85vh] w-[min(100vw-2rem,32rem)] border-0 bg-surface p-0 text-text-primary shadow-2xl ring-1 ring-border/40 open:flex open:flex-col [&::backdrop]:bg-[hsl(220_80%_5%/0.75)] [&::backdrop]:backdrop-blur-sm"
      onPointerDown={handlePointerDownBackdrop}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border/30 bg-surface/50 px-6 py-4 backdrop-blur-md">
        <h3 id="modal-title" className="font-semibold text-text-primary">
          {title}
        </h3>
        <button
          type="button"
          onClick={() => onClose()}
          className="rounded-full p-1 text-text-muted transition-colors hover:bg-accent/10 hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
    </dialog>
  );
}
