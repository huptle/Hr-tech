"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Dropdown({
  trigger,
  children,
  align = "right"
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer flex items-center justify-center">
        {trigger}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-2 min-w-[160px] rounded-xl border border-border/40 bg-surface/95 backdrop-blur-md shadow-xl z-50 overflow-hidden`}
            onClick={() => setIsOpen(false)}
          >
            <div className="py-1.5 flex flex-col">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({ children, className = "", onClick }: { children: ReactNode, className?: string, onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 bg-transparent text-left text-sm text-text-secondary hover:bg-accent/10 hover:text-text-primary transition-colors flex items-center gap-2.5 w-full outline-none font-medium ${className}`}
    >
      {children}
    </button>
  );
}
