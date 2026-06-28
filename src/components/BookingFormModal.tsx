"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Plus, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/Toast";
import { QUANTITY_UNITS } from "@/lib/constants";
import { todayISO } from "@/lib/utils";
import type { Booking, BookingInput, QuantityUnit } from "@/lib/types";

interface BookingFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  booking?: Booking | null;
  userId: string;
  userName: string;
  onClose: () => void;
}

type FormErrors = Partial<Record<keyof BookingInput, string>>;

function emptyForm(): BookingInput {
  return {
    booking_date: todayISO(),
    party_name: "",
    item_name: "",
    booking_rate: 0,
    quantity: 0,
    quantity_unit: "Bags",
    broker: "",
    remarks: "",
  };
}

export function BookingFormModal({
  open,
  mode,
  booking,
  userId,
  userName,
  onClose,
}: BookingFormModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const [form, setForm] = useState<BookingInput>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Seed the form whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === "edit" && booking) {
      setForm({
        booking_date: booking.booking_date,
        party_name: booking.party_name,
        item_name: booking.item_name,
        booking_rate: booking.booking_rate,
        quantity: booking.quantity,
        quantity_unit: booking.quantity_unit,
        broker: booking.broker,
        remarks: booking.remarks ?? "",
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, mode, booking]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  const set = <K extends keyof BookingInput>(key: K, value: BookingInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.booking_date) e.booking_date = "Pick a date.";
    if (!form.party_name.trim()) e.party_name = "Party name is required.";
    if (!form.item_name.trim()) e.item_name = "Item name is required.";
    if (!(form.booking_rate > 0)) e.booking_rate = "Enter a rate greater than 0.";
    if (!(form.quantity > 0)) e.quantity = "Enter a quantity greater than 0.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const payload = {
      booking_date: form.booking_date,
      party_name: form.party_name.trim(),
      item_name: form.item_name.trim(),
      booking_rate: Number(form.booking_rate),
      quantity: Number(form.quantity),
      quantity_unit: form.quantity_unit,
      broker: form.broker.trim(),
      remarks: form.remarks.trim() || null,
    };

    try {
      if (mode === "create") {
        const { error } = await supabase.from("bookings").insert({
          ...payload,
          created_by: userId,
          booked_by_name: userName,
        });
        if (error) throw error;
        toast("Booking added.", "success");
      } else if (booking) {
        const { error } = await supabase
          .from("bookings")
          .update(payload)
          .eq("id", booking.id);
        if (error) throw error;
        toast("Booking updated.", "success");
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={() => !saving && onClose()} />

      <div className="relative flex max-h-[92dvh] w-full max-w-lg animate-scale-in flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-pop sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">
              {mode === "create" ? "New booking" : "Edit booking"}
            </h2>
            <p className="text-[12px] text-muted">
              {mode === "create"
                ? `Booked by ${userName}`
                : "Update the details and save."}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid grid-cols-1 gap-4 overflow-y-auto px-5 py-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="booking_date" required error={errors.booking_date}>
              <Input
                id="booking_date"
                type="date"
                value={form.booking_date}
                onChange={(e) => set("booking_date", e.target.value)}
              />
            </Field>

            <Field label="Broker" htmlFor="broker" hint="optional">
              <Input
                id="broker"
                placeholder="e.g. Verma & Sons"
                value={form.broker}
                onChange={(e) => set("broker", e.target.value)}
              />
            </Field>

            <Field label="Party Name" htmlFor="party_name" required error={errors.party_name} className="sm:col-span-2">
              <Input
                id="party_name"
                placeholder="e.g. Shree Traders"
                value={form.party_name}
                onChange={(e) => set("party_name", e.target.value)}
                autoFocus
              />
            </Field>

            <Field label="Item Name" htmlFor="item_name" required error={errors.item_name} className="sm:col-span-2">
              <Input
                id="item_name"
                placeholder="e.g. Wheat (Lokwan)"
                value={form.item_name}
                onChange={(e) => set("item_name", e.target.value)}
              />
            </Field>

            <Field label="Booking Rate" htmlFor="booking_rate" required error={errors.booking_rate}>
              <Input
                id="booking_rate"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.booking_rate || ""}
                onChange={(e) => set("booking_rate", parseFloat(e.target.value) || 0)}
              />
            </Field>

            <Field label="Quantity Booked" htmlFor="quantity" required error={errors.quantity}>
              <div className="flex gap-2">
                <Input
                  id="quantity"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  className="flex-1"
                  value={form.quantity || ""}
                  onChange={(e) => set("quantity", parseFloat(e.target.value) || 0)}
                />
                <Select
                  aria-label="Unit"
                  className="w-24 shrink-0"
                  value={form.quantity_unit}
                  onChange={(e) => set("quantity_unit", e.target.value as QuantityUnit)}
                >
                  {QUANTITY_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </div>
            </Field>

            <Field label="Remarks" htmlFor="remarks" hint="optional" className="sm:col-span-2">
              <Textarea
                id="remarks"
                placeholder="Any notes about this booking…"
                value={form.remarks}
                onChange={(e) => set("remarks", e.target.value)}
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border bg-bg/50 px-5 py-3">
            <Button type="button" variant="secondary" onClick={() => !saving && onClose()} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {mode === "create" ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {mode === "create" ? "Add booking" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
