"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Minimal dark/light theme toggle.
 * Persists preference in localStorage and applies `data-theme` on <html>.
 * Works without next-themes dependency.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer setState so it is not synchronous in the effect body (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      setMounted(true);
      const stored = localStorage.getItem("theme") as "dark" | "light" | null;
      const initial = stored ?? "dark";
      setTheme(initial);
      document.documentElement.setAttribute("data-theme", initial);
    });
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  // Prevent hydration flash — render once mounted
  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-lg" aria-hidden />
    );
  }

  return (
    <button
      id="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-all duration-200 hover:border-accent/40 hover:text-accent hover:bg-accent/8 active:scale-95"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
