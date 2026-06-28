"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-sm animate-scale-in rounded-xl border border-border bg-surface p-5 shadow-pop"
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-soft">
          <AlertTriangle className="h-5 w-5 text-danger" />
        </div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
