/**
 * Shared UI primitives used across all pages.
 * Centralises the repeated layout/style patterns.
 */
import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── PageWrapper ─────────────────────────────────────────────────────────────
   Wraps every page: mesh-bg orbs + a relative z-10 content layer.
*/
export function PageWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative min-h-full", className)}>
      <div className="mesh-bg" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ─── PageLayout ──────────────────────────────────────────────────────────────
   Centres content at max-w-5xl with standard side padding.
*/
export function PageLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-5xl px-6", className)}>{children}</div>
  );
}

/* ─── SectionCard ─────────────────────────────────────────────────────────────
   Standard content card: rounded, bordered, glass-like surface.
*/
export const SectionCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-border/40 bg-surface/80 backdrop-blur-sm shadow-xl shadow-black/10",
      className
    )}
    {...props}
  />
));
SectionCard.displayName = "SectionCard";

/* ─── SectionCardHeader ───────────────────────────────────────────────────────
   Flex row with an icon badge slot, title, and optional right slot.
   Bordered bottom separator.
*/
export function SectionCardHeader({
  icon,
  title,
  right,
  iconBg = "bg-accent/15",
  iconColor = "text-accent",
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  right?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border/30 px-6 py-4">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          iconBg,
          iconColor
        )}
      >
        {icon}
      </div>
      <h2 className="text-sm font-semibold text-text-primary flex-1">{title}</h2>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

/* ─── SectionHeading ──────────────────────────────────────────────────────────
   Small all-caps section label (e.g. "Your jobs", "Recent jobs").
*/
export function SectionHeading({
  children,
  right,
  className,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
        {children}
      </h2>
      {right}
    </div>
  );
}

/* ─── FormField ───────────────────────────────────────────────────────────────
   Label + input/textarea wrapper with shared styles.
*/
const fieldInputClass =
  "w-full rounded-xl border border-border/40 bg-surface-2/60 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-all duration-200 hover:border-accent/30 focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(6,190,225,0.10)]";

const fieldLabelClass =
  "block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5";

export function FormField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={fieldLabelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

export { fieldInputClass, fieldLabelClass };

/* ─── Buttons ──────────────────────────────────────────────────────────────── */
export function BtnPrimary({
  children,
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 hover:shadow-accent/35 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({
  children,
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl glass border border-border/40 px-4 py-2 text-sm font-medium text-text-primary transition-all duration-200 hover:bg-accent/5 hover:border-accent/30",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnDanger({
  children,
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-danger/25 bg-danger/8 px-3 py-1.5 text-xs font-medium text-red-400 transition-all duration-200 hover:bg-danger/18 hover:border-danger/40",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* Link versions of buttons */
export function LinkBtnPrimary({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 hover:shadow-accent/35 hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function LinkBtnSecondary({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl glass border border-border/40 px-4 py-2 text-sm font-medium text-text-primary transition-all duration-200 hover:bg-accent/5 hover:border-accent/30",
        className
      )}
    >
      {children}
    </Link>
  );
}

/* ─── EmptyState ──────────────────────────────────────────────────────────────
   Standard empty placeholder with icon, title, subtitle, optional action.
*/
export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  iconBg = "bg-accent/10",
  iconColor = "text-accent/60",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border/40 bg-surface/40 p-12 text-center">
      <div
        className={cn(
          "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl",
          iconBg,
          iconColor
        )}
      >
        {icon}
      </div>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      {subtitle && (
        <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ─── Breadcrumb ──────────────────────────────────────────────────────────────
   Simple back-link with ArrowLeft icon.
*/
export function Breadcrumb({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-4"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

/* ─── InitialAvatar ───────────────────────────────────────────────────────────
   Circular/square badge showing first letter of a name.
*/
export function InitialAvatar({
  name,
  size = "md",
  shape = "circle",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "square";
}) {
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center gradient-bg font-bold text-white shadow-md shadow-accent/20",
        shape === "circle" ? "rounded-full" : "rounded-xl",
        sizes[size]
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
