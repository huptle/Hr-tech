import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:  "bg-border/40 text-text-secondary border border-border/40",
        accent:   "bg-accent/15 text-accent border border-accent/25",
        success:  "bg-success/15 text-success border border-success/25",
        warning:  "bg-warning/15 text-warning border border-warning/25",
        danger:   "bg-danger/15 text-red-400 border border-danger/25",
        ai:       "bg-accent-deep/15 text-blue-300 border border-accent-deep/25",
        hr:       "bg-accent/12 text-accent border border-accent/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
