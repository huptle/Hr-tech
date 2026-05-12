"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Shared easing ────────────────────────────────────────────────────────────
const ease = [0.25, 0.46, 0.45, 0.94] as const;

// ─── Fade-in from bottom ──────────────────────────────────────────────────────
export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Staggered list container ─────────────────────────────────────────────────
export function StaggerList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
      }}
      className={className}
    >
      {children}
    </motion.ul>
  );
}

// ─── Staggered list item ──────────────────────────────────────────────────────
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
      }}
      className={className}
    >
      {children}
    </motion.li>
  );
}

// ─── Staggered ordered list ───────────────────────────────────────────────────
export function StaggerOl({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.ol
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
      }}
      className={className}
    >
      {children}
    </motion.ol>
  );
}

// ─── Card with hover lift + glow ──────────────────────────────────────────────
export function AnimCard({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      whileHover={{
        y: -3,
        boxShadow: "0 0 0 1px rgba(6,190,225,0.3), 0 8px 40px rgba(6,190,225,0.15)",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Stat counter card ─────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  sub,
  delay = 0,
  icon,
}: {
  label: string;
  value?: React.ReactNode;
  sub?: React.ReactNode;
  delay?: number;
  icon?: React.ReactNode;
}) {
  return (
    <AnimCard
      delay={delay}
      className="rounded-2xl border border-border/40 bg-surface/80 backdrop-blur-sm p-6 flex flex-col gap-3 shadow-xl shadow-black/10"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          {label}
        </p>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            {icon}
          </div>
        )}
      </div>
      {value != null ? (
        <p className="text-4xl font-bold tabular-nums gradient-text">{value}</p>
      ) : (
        <div className="mt-1">{sub}</div>
      )}
    </AnimCard>
  );
}

// ─── Page header fade ──────────────────────────────────────────────────────────
export function PageHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className={className}
    >
      {children}
    </motion.header>
  );
}

// ─── Section reveal ────────────────────────────────────────────────────────────
export function Section({
  children,
  className,
  delay = 0,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  [key: string]: unknown;
}) {
  void rest;
  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Pipeline step ─────────────────────────────────────────────────────────────
export function PipelineStep({
  index,
  title,
  detail,
}: {
  index: number;
  title: string;
  detail: string;
}) {
  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.42, ease } },
      }}
      whileHover={{
        y: -3,
        boxShadow: "0 0 0 1px rgba(6,190,225,0.3), 0 8px 32px rgba(6,190,225,0.12)",
      }}
      className="rounded-2xl border border-border/40 bg-surface/80 backdrop-blur-sm p-5 flex gap-4 cursor-default transition-colors"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-bg text-xs font-bold text-white shadow-lg shadow-accent/30">
        {index}
      </span>
      <div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">{detail}</p>
      </div>
    </motion.li>
  );
}

// ─── Animated table row ────────────────────────────────────────────────────────
export function AnimTableRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.tr
      variants={{
        hidden: { opacity: 0, x: -8 },
        show: { opacity: 1, x: 0, transition: { duration: 0.35, ease } },
      }}
      whileHover={{ backgroundColor: "rgba(6,190,225,0.03)" }}
      className={cn("transition-colors", className)}
    >
      {children}
    </motion.tr>
  );
}

// ─── ScoreBar - animated score pill ───────────────────────────────────────────
export function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  // Palette-aligned colors: cyan → mid-blue → deep-blue
  const color =
    pct >= 75
      ? "from-cyan-400 to-sky-500"          // #06BEE1 family
      : pct >= 50
        ? "from-blue-500 to-indigo-500"        // #1768AC / #2541B2 family
        : "from-amber-500 to-orange-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-border/40 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums text-text-secondary">
        {Math.round(score)}
      </span>
    </div>
  );
}

// ─── Re-export AnimatePresence ─────────────────────────────────────────────────
export { AnimatePresence };
