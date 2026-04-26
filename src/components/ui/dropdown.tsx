"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

export function Dropdown({
  trigger,
  children,
  align = "right",
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeIfOutside(e: Event) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (ref.current && !ref.current.contains(target)) {
        setIsOpen(false);
      }
    }
    // pointerdown + capture: works for touch and runs before inner click handlers mis-fire
    document.addEventListener("pointerdown", closeIfOutside, true);
    return () => document.removeEventListener("pointerdown", closeIfOutside, true);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((o) => !o);
          }
        }}
        className="flex cursor-pointer items-center justify-center"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {trigger}
      </div>
      {isOpen && (
        <div
          className={`absolute z-[120] mt-2 min-w-[160px] overflow-hidden rounded-xl border border-border/40 bg-surface/95 shadow-xl backdrop-blur-md ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
        >
          <div
            className="flex flex-col py-1.5"
            onClick={() => setIsOpen(false)}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 bg-transparent px-4 py-2 text-left text-sm font-medium text-text-secondary outline-none transition-colors hover:bg-accent/10 hover:text-text-primary ${className}`}
    >
      {children}
    </button>
  );
}
