"use client";

import { useMemo, useState } from "react";
import { Warehouse, ChevronDown } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import type { Delivery } from "@/lib/types";

interface GodownSummaryProps {
  deliveries: Delivery[];
}

/**
 * Shows how much total stock has been received into each godown,
 * split by unit (Bags / KG). Collapsible to stay out of the way.
 */
export function GodownSummary({ deliveries }: GodownSummaryProps) {
  const [open, setOpen] = useState(false);

  const summary = useMemo(() => {
    const map = new Map<string, { Bags: number; KG: number }>();
    for (const d of deliveries) {
      const entry = map.get(d.godown_name) ?? { Bags: 0, KG: 0 };
      entry[d.quantity_unit] += Number(d.quantity_received);
      map.set(d.godown_name, entry);
    }
    return Array.from(map.entries())
      .map(([name, totals]) => ({ name, ...totals }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [deliveries]);

  if (summary.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-bg/50"
      >
        <Warehouse className="h-4 w-4 text-primary" />
        <span className="text-[13px] font-semibold text-ink">Stock by godown</span>
        <span className="text-[12px] text-muted">
          ({summary.length} {summary.length === 1 ? "godown" : "godowns"})
        </span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 text-faint transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-2 border-t border-border px-4 py-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map((g) => (
            <div
              key={g.name}
              className="rounded-lg border border-border bg-bg/40 px-3 py-2.5"
            >
              <p className="truncate text-[13px] font-medium text-ink">{g.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[12px] tabular-nums text-muted">
                {g.Bags > 0 && <span>{formatNumber(g.Bags)} Bags</span>}
                {g.KG > 0 && <span>{formatNumber(g.KG)} KG</span>}
                {g.Bags === 0 && g.KG === 0 && <span className="text-faint">—</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
