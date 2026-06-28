"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const accents: Record<ToastKind, string> = {
  success: "text-primary",
  error: "text-danger",
  info: "text-muted",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = ++counter.current;
      setToasts((t) => [...t, { id, kind, message }]);
      setTimeout(() => remove(id), 3800);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => {
          const Icon = icons[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-fade-in items-start gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 shadow-pop"
            >
              <Icon className={cn("mt-0.5 h-[18px] w-[18px] shrink-0", accents[t.kind])} aria-hidden />
              <p className="flex-1 text-[13px] font-medium leading-snug text-ink">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="rounded-md p-0.5 text-faint transition-colors hover:bg-bg hover:text-ink"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
