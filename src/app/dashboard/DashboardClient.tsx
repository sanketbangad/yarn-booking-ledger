"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { BookingTable } from "@/components/BookingTable";
import { BookingFormModal } from "@/components/BookingFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { useBookings } from "@/hooks/useBookings";
import { createClient } from "@/lib/supabase/client";
import type { Booking, Profile } from "@/lib/types";

interface DashboardClientProps {
  profile: Profile;
}

export function DashboardClient({ profile }: DashboardClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const { bookings, loading, error, flashId } = useBookings();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Booking | null>(null);

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

  return (
    <div className="min-h-dvh">
      <Header profile={profile} />

      <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-[13px] font-medium text-danger">
            Couldn&apos;t load bookings: {error}
          </div>
        )}

        <BookingTable
          bookings={bookings}
          loading={loading}
          currentUserId={profile.id}
          isAdmin={isAdmin}
          flashId={flashId}
          onNew={openCreate}
          onEdit={openEdit}
          onDelete={setToDelete}
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
