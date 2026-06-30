"use client";

import { useState } from "react";
import {
  ClipboardList, Plus, Check, Trash2, ChevronDown, RotateCcw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/Toast";
import { cn, formatNumber, formatTimestamp, formatDate } from "@/lib/utils";
import type { Requirement } from "@/lib/types";

interface RequirementsPanelProps {
  open: Requirement[];
  fulfilled: Requirement[];
  loading: boolean;
  userId: string;
  userName: string;
  isAdmin: boolean;
  onAdd: () => void;
}

export function RequirementsPanel({
  open,
  fulfilled,
  loading,
  userId,
  userName,
  isAdmin,
  onAdd,
}: RequirementsPanelProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [showDone, setShowDone] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setFulfilled(r: Requirement, value: boolean) {
    setBusyId(r.id);
    const { error } = await supabase
      .from("requirements")
      .update({
        fulfilled: value,
        fulfilled_by: value ? userId : null,
        fulfilled_by_name: value ? userName : null,
        fulfilled_at: value ? new Date().toISOString() : null,
      })
      .eq("id", r.id);
    setBusyId(null);
    if (error) toast(error.message, "error");
    else if (value) toast("Requirement marked as ordered.", "success");
  }

  async function remove(r: Requirement) {
    setBusyId(r.id);
    const { error } = await supabase.from("requirements").delete().eq("id", r.id);
    setBusyId(null);
    if (error) toast(error.message, "error");
    else toast("Requirement removed.", "success");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <ClipboardList className="h-4 w-4 text-primary" />
        <span className="text-[14px] font-semibold text-ink">Yarn requirements</span>
        {open.length > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">
            {open.length}
          </span>
        )}
        <Button size="sm" className="ml-auto" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add requirement</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Open list */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-bg" />
            ))}
          </div>
        ) : open.length === 0 ? (
          <p className="rounded-lg bg-bg px-3 py-5 text-center text-[13px] text-muted">
            No open requirements. Tap <span className="font-medium text-ink">Add requirement</span> when yarn is needed against a PO.
          </p>
        ) : (
          <ul className="space-y-2">
            {open.map((r) => (
              <li
                key={r.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
              >
                <button
                  onClick={() => setFulfilled(r, true)}
                  disabled={busyId === r.id}
                  className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border border-border-strong text-transparent transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary disabled:opacity-50"
                  aria-label="Mark as ordered"
                  title="Mark as ordered"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">
                    <span className="rounded bg-primary-soft px-1.5 py-px font-mono text-[11px] text-primary">
                      {r.po_number}
                    </span>{" "}
                    {r.yarn_name}
                  </p>
                  <p className="mt-0.5 font-mono text-[12px] tabular-nums text-muted">
                    {formatNumber(r.quantity)} {r.quantity_unit}
                  </p>
                  {r.remarks && (
                    <p className="mt-1 text-[12px] text-muted">{r.remarks}</p>
                  )}
                  <p className="mt-1 text-[11px] text-faint">
                    {r.created_by_name} · {formatTimestamp(r.created_at)}
                  </p>
                </div>

                {(isAdmin || r.created_by === userId) && (
                  <button
                    onClick={() => remove(r)}
                    disabled={busyId === r.id}
                    className="rounded-md p-1.5 text-faint transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                    aria-label="Delete requirement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Fulfilled (hidden by default) */}
        {fulfilled.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowDone((s) => !s)}
              className="flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-ink"
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showDone && "rotate-180")} />
              {showDone ? "Hide" : "Show"} fulfilled ({fulfilled.length})
            </button>

            {showDone && (
              <ul className="mt-2 space-y-1.5">
                {fulfilled.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 rounded-lg bg-bg px-3 py-2"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-primary text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] text-muted line-through">
                        <span className="font-mono">{r.po_number}</span> · {r.yarn_name} ·{" "}
                        {formatNumber(r.quantity)} {r.quantity_unit}
                      </p>
                      <p className="text-[10px] text-faint">
                        Ordered by {r.fulfilled_by_name ?? "—"}
                        {r.fulfilled_at ? ` · ${formatDate(r.fulfilled_at)}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => setFulfilled(r, false)}
                      disabled={busyId === r.id}
                      className="rounded-md p-1.5 text-faint transition-colors hover:bg-surface hover:text-ink disabled:opacity-50"
                      aria-label="Move back to open"
                      title="Move back to open"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    {(isAdmin || r.created_by === userId) && (
                      <button
                        onClick={() => remove(r)}
                        disabled={busyId === r.id}
                        className="rounded-md p-1.5 text-faint transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                        aria-label="Delete requirement"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
