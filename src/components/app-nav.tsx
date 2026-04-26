"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/jobs", label: "Job Portal" },
  { href: "/overview", label: "Overview" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3.5">
        {/* Logo */}
        <Link href="/jobs" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-bg shadow-md shadow-accent/30 group-hover:shadow-accent/50 transition-shadow">
            <span className="text-xs font-bold text-white">H</span>
          </div>
          <span className="text-sm font-semibold text-text-primary tracking-tight">
            HR<span className="gradient-text">Tech</span>
          </span>
        </Link>

        {/* Divider */}
        <div className="h-4 w-px bg-border/40" aria-hidden />

        {/* Links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "text-text-primary"
                    : "text-text-muted hover:text-text-secondary hover:bg-accent/5"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-accent/10 border border-accent/20"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.35 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </motion.nav>
  );
}
