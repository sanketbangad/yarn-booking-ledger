"use client";

import { useEffect, useState } from "react";
import { X, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/Toast";
import { QUANTITY_UNITS } from "@/lib/constants";
import type { QuantityUnit } from "@/lib/types";

interface RequirementFormModalProps {
  open: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
}

export function RequirementFormModal({
  open,
  userId,
  userName,
  onClose,
}: RequirementFormModalProps) {
  const supabase = createClient();
  const { toast } = useToast();

  const [po, setPo] = useState("");
  const [yarn, setYarn] = useState("");
  const [qty, setQty] = useState(0);
  const [unit, setUnit] = useState<QuantityUnit>("Bags");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPo("");
    setYarn("");
    setQty(0);
    setUnit("Bags");
    setRemarks("");
    setErr(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setErr(null);

    if (!po.trim()) return setErr("Enter the PO number.");
    if (!yarn.trim()) return setErr("Enter which yarn is required.");
    if (!(qty > 0)) return setErr("Enter a quantity greater than 0.");

    setSaving(true);
    try {
      const { error } = await supabase.from("requirements").insert({
        po_number: po.trim(),
        yarn_name: yarn.trim(),
        quantity: Number(qty),
        quantity_unit: unit,
        remarks: remarks.trim() || null,
        fulfilled: false,
        created_by: userId,
        created_by_name: userName,
      });
      if (error) throw error;
      toast("Requirement added.", "success");
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={() => !saving && onClose()}
      />

      <div className="relative flex max-h-[92dvh] w-full max-w-md animate-scale-in flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-pop sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
            <ClipboardList className="h-4 w-4 text-primary" /> New yarn requirement
          </h2>
          <button
            onClick={() => !saving && onClose()}
            className="rounded-lg p-1.5 text-faint transition-colors hover:bg-bg hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="PO number" htmlFor="po" required>
              <Input
                id="po"
                placeholder="e.g. PO-2026-104"
                value={po}
                onChange={(e) => setPo(e.target.value)}
                autoFocus
              />
            </Field>

            <Field label="Yarn required" htmlFor="yarn" required>
              <Input
                id="yarn"
                placeholder="e.g. 30s Combed Cotton"
                value={yarn}
                onChange={(e) => setYarn(e.target.value)}
              />
            </Field>

            <Field label="Quantity" htmlFor="qty" required>
              <Input
                id="qty"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                value={qty || ""}
                onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
              />
            </Field>

            <Field label="Unit" htmlFor="unit" required>
              <Select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as QuantityUnit)}
              >
                {QUANTITY_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Remarks" htmlFor="rem" hint="optional" className="sm:col-span-2">
              <Textarea
                id="rem"
                placeholder="Supplier preference, urgency, shade, etc."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-h-[60px]"
              />
            </Field>
          </div>

          {err && <p className="mt-2 text-[12px] font-medium text-danger">{err}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => !saving && onClose()}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add requirement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
