"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink " +
  "placeholder:text-faint transition-colors " +
  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 " +
  "disabled:cursor-not-allowed disabled:bg-bg disabled:text-muted";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, "h-10", className)} {...props} />;
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(fieldBase, "h-10 appearance-none bg-no-repeat pr-9", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
        backgroundPosition: "right 0.6rem center",
        backgroundSize: "16px",
      }}
      {...props}
    >
      {children}
    </select>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldBase, "min-h-[72px] resize-y py-2 leading-relaxed", className)}
      {...props}
    />
  );
});

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, required, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-[13px] font-medium text-ink">
        {label}
        {required && <span className="text-danger">*</span>}
        {hint && <span className="ml-auto text-[11px] font-normal text-faint">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-[12px] font-medium text-danger">{error}</p>}
    </div>
  );
}
