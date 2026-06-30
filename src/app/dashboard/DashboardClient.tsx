"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { BookingTable } from "@/components/BookingTable";
import { BookingFormModal } from "@/components/BookingFormModal";
import { DeliveryModal } from "@/components/DeliveryModal";
import { GodownSummary } from "@/components/GodownSummary";
import { RequirementsPanel } from "@/components/RequirementsPanel";
import { RequirementFormModal } from "@/components/RequirementFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { useBookings } from "@/hooks/useBookings";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useGodowns } from "@/hooks/useGodowns";
import { useRequirements } from "@/hooks/useRequirements";
import { createClient } from "@/lib/supabase/client";
import type { Booking, Profile } from "@/lib/types";

interface DashboardClientProps {
  profile: Profile;
}

export function DashboardClient({ profile }: DashboardClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const { bookings, loading, error, flashId } = useBookings();
  const { deliveries, byBooking, receivedByBooking } = useDeliveries();
  const { godowns, addGodown } = useGodowns();
  const {
    open: openReqs,
    fulfilled: fulfilledReqs,
    loading: reqLoading,
  } = useRequirements();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Booking | null>(null);

  const [receiving, setReceiving] = useState<Booking | null>(null);
  const [reqFormOpen, setReqFormOpen] = useState(false);

  const [toDelete, setToDelete] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = profile.role === "admin";

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(b: Booking) {
    setFormMode("edit");
    setEditing(b);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("bookings").delete().eq("id", toDelete.id);
    setDeleting(false);

    if (error) {
      toast(error.message, "error");
    } else {
      toast("Booking deleted.", "success");
      setToDelete(null);
    }
  }

  const receivingLive = receiving
    ? bookings.find((b) => b.id === receiving.id) ?? receiving
    : null;

  return (
    <div className="min-h-dvh">
      <Header profile={profile} />

      <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-[13px] font-medium text-danger">
            Couldn&apos;t load bookings: {error}
          </div>
        )}

        <div className="mb-3">
          <RequirementsPanel
            open={openReqs}
            fulfilled={fulfilledReqs}
            loading={reqLoading}
            userId={profile.id}
            userName={profile.full_name}
            isAdmin={isAdmin}
            onAdd={() => setReqFormOpen(true)}
          />
        </div>

        <div className="mb-3">
          <GodownSummary deliveries={deliveries} />
        </div>

        <BookingTable
          bookings={bookings}
          loading={loading}
          currentUserId={profile.id}
          isAdmin={isAdmin}
          flashId={flashId}
          receivedByBooking={receivedByBooking}
          onNew={openCreate}
          onEdit={openEdit}
          onDelete={setToDelete}
          onReceive={setReceiving}
        />
      </main>

      <BookingFormModal
        open={formOpen}
        mode={formMode}
        booking={editing}
        userId={profile.id}
        userName={profile.full_name}
        onClose={() => setFormOpen(false)}
      />

      <DeliveryModal
        open={!!receivingLive}
        booking={receivingLive}
        deliveries={receivingLive ? byBooking.get(receivingLive.id) ?? [] : []}
        godowns={godowns}
        userId={profile.id}
        userName={profile.full_name}
        isAdmin={isAdmin}
        onAddGodown={addGodown}
        onClose={() => setReceiving(null)}
      />

      <RequirementFormModal
        open={reqFormOpen}
        userId={profile.id}
        userName={profile.full_name}
        onClose={() => setReqFormOpen(false)}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this booking?"
        message={
          toDelete
            ? `${toDelete.party_name} · ${toDelete.item_name}. This can't be undone.`
            : ""
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
