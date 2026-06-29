"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Plus, Trash2, PackageCheck, Warehouse } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/Toast";
import { todayISO, formatDate, formatNumber } from "@/lib/utils";
import type { Booking, Delivery, Godown } from "@/lib/types";

interface DeliveryModalProps {
  open: boolean;
  booking: Booking | null;
  deliveries: Delivery[]; // receipts for this booking (newest first)
  godowns: Godown[];
  userId: string;
  userName: string;
  isAdmin: boolean;
  onAddGodown: (name: string) => Promise<string | null>;
  onClose: () => void;
}

const NEW_GODOWN = "__new__";

export function DeliveryModal({
  open,
  booking,
  deliveries,
  godowns,
  userId,
  userName,
  isAdmin,
  onAddGodown,
  onClose,
}: DeliveryModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [qty, setQty] = useState(0);
  const [godown, setGodown] = useState("");
  const [newGodown, setNewGodown] = useState("");
  const [date, setDate] = useState(todayISO());
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQty(0);
    setGodown(godowns[0]?.name ?? NEW_GODOWN);
    setNewGodown("");
    setDate(todayISO());
    setRemarks("");
    setErr(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open || !booking) return null;

  const unit = booking.quantity_unit;
  const ordered = Number(booking.quantity);
  const received = deliveries.reduce(
    (s, d) => s + Number(d.quantity_received),
    0
  );
  const pending = Math.max(0, ordered - received);
  const pct = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;
  const canModify = (d: Delivery) => isAdmin || d.received_by === userId;

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault();
    if (!booking) return;
    setErr(null);

    if (!(qty > 0)) {
      setErr("Enter a received quantity greater than 0.");
      return;
    }
    let godownName = godown;
    if (godown === NEW_GODOWN) {
      if (!newGodown.trim()) {
        setErr("Enter the new godown name.");
        return;
      }
      try {
        const added = await onAddGodown(newGodown);
        godownName = added ?? newGodown.trim();
      } catch {
        setErr("Couldn't add that godown. Try again.");
        return;
      }
    }
    if (!godownName || godownName === NEW_GODOWN) {
      setErr("Choose a godown.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("deliveries").insert({
        booking_id: booking.id,
        quantity_received: Number(qty),
        quantity_unit: unit,
        godown_name: godownName,
        received_date: date,
        remarks: remarks.trim() || null,
        received_by: userId,
        received_by_name: userName,
      });
      if (error) throw error;
      toast(`Recorded ${formatNumber(qty)} ${unit} at ${godownName}.`, "success");
      setQty(0);
      setRemarks("");
      setNewGodown("");
      if (godown === NEW_GODOWN) setGodown(godownName);
    } catch (e) {
      const m = e instanceof Error ? e.message : "Something went wrong.";
      toast(m, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(d: Delivery) {
    setDeletingId(d.id);
    const { error } = await supabase.from("deliveries").delete().eq("id", d.id);
    setDeletingId(null);
    if (error) toast(error.message, "error");
    else toast("Receipt removed.", "success");
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={() => !saving && onClose()}
      />

      <div className="relative flex max-h-[92dvh] w-full max-w-lg animate-scale-in flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-pop sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
              <PackageCheck className="h-4 w-4 text-primary" /> Record delivery
            </h2>
            <p className="truncate text-[12px] text-muted">
              {booking.party_name} · {booking.item_name}
            </p>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="rounded-lg p-1.5 text-faint transition-colors hover:bg-bg hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Progress summary */}
          <div className="border-b border-border bg-bg/40 px-5 py-3.5">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Booked" value={`${formatNumber(ordered)}`} unit={unit} />
              <Stat label="Received" value={`${formatNumber(received)}`} unit={unit} tone="primary" />
              <Stat label="Pending" value={`${formatNumber(pending)}`} unit={unit} tone={pending > 0 ? "warn" : "ok"} />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-[11px] text-muted">
              {pct}% received{pending === 0 ? " · fully delivered" : ""}
            </p>
          </div>

          {/* Add delivery form */}
          <form onSubmit={handleAdd} className="border-b border-border px-5 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={`Quantity received (${unit})`} htmlFor="qty" required>
                <Input
                  id="qty"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={qty || ""}
                  onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                  autoFocus
                />
              </Field>

              <Field label="Received date" htmlFor="rdate" required>
                <Input
                  id="rdate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>

              <Field label="Godown" htmlFor="godown" required className="sm:col-span-2">
                <Select
                  id="godown"
                  value={godown}
                  onChange={(e) => setGodown(e.target.value)}
                >
                  {godowns.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                  <option value={NEW_GODOWN}>+ Add new godown…</option>
                </Select>
              </Field>

              {godown === NEW_GODOWN && (
                <Field label="New godown name" htmlFor="newg" required className="sm:col-span-2">
                  <Input
                    id="newg"
                    placeholder="e.g. Cold Storage Unit 3"
                    value={newGodown}
                    onChange={(e) => setNewGodown(e.target.value)}
                  />
                </Field>
              )}

              <Field label="Remarks" htmlFor="drem" hint="optional" className="sm:col-span-2">
                <Textarea
                  id="drem"
                  placeholder="Vehicle no., lot, condition on arrival…"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="min-h-[56px]"
                />
              </Field>
            </div>

            {err && <p className="mt-2 text-[12px] font-medium text-danger">{err}</p>}

            <div className="mt-3 flex justify-end">
              <Button type="submit" loading={saving}>
                <Plus className="h-4 w-4" /> Add receipt
              </Button>
            </div>
          </form>

          {/* History */}
          <div className="px-5 py-4">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
              Delivery history
            </p>
            {deliveries.length === 0 ? (
              <p className="rounded-lg bg-bg px-3 py-4 text-center text-[13px] text-muted">
                No deliveries recorded yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {deliveries.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
                  >
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                      <Warehouse className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">
                        <span className="font-mono tabular-nums">
                          {formatNumber(d.quantity_received)}
                        </span>{" "}
                        {d.quantity_unit} · {d.godown_name}
                      </p>
                      <p className="text-[11px] text-muted">
                        {formatDate(d.received_date)} · {d.received_by_name}
                      </p>
                      {d.remarks && (
                        <p className="mt-1 text-[12px] text-muted">{d.remarks}</p>
                      )}
                    </div>
                    {canModify(d) && (
                      <button
                        onClick={() => handleDelete(d)}
                        disabled={deletingId === d.id}
                        className="rounded-md p-1.5 text-faint transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                        aria-label="Delete receipt"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border bg-bg/50 px-5 py-3">
          <Button type="button" variant="secondary" onClick={() => !saving && onClose()}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  tone = "ink",
}: {
  label: string;
  value: string;
  unit: string;
  tone?: "ink" | "primary" | "warn" | "ok";
}) {
  const color =
    tone === "primary"
      ? "text-primary"
      : tone === "warn"
      ? "text-danger"
      : tone === "ok"
      ? "text-primary"
      : "text-ink";
  return (
    <div className="rounded-lg bg-surface px-2 py-2">
      <p className="text-[10px] uppercase tracking-wide text-faint">{label}</p>
      <p className={`font-mono text-[16px] font-semibold tabular-nums ${color}`}>
        {value}
      </p>
      <p className="text-[10px] text-faint">{unit}</p>
    </div>
  );
}
