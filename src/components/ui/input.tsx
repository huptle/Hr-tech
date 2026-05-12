import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label: _label, id, ...props }, ref) => {
    void _label;
    return (
      <input
        type={type}
        id={id}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-all duration-200",
          "hover:border-white/20 hover:bg-white/7",
          "focus:outline-none focus:border-accent/60 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-all duration-200",
          "hover:border-white/20 hover:bg-white/7",
          "focus:outline-none focus:border-accent/60 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]",
          "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white/10 bg-surface-2 px-3 py-2 text-sm text-text-primary transition-all duration-200",
          "hover:border-white/20",
          "focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Input, Textarea, Select, Label };
