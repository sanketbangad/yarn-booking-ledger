"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Booking } from "@/lib/types";

interface UseBookingsResult {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  /** id of the most recently inserted/updated row, for a brief highlight */
  flashId: string | null;
  refetch: () => Promise<void>;
}

/**
 * Loads all bookings and keeps them in sync in realtime. Every connected
 * client receives INSERT / UPDATE / DELETE events and updates instantly —
 * no refresh required.
 */
export function useBookings(): UseBookingsResult {
  const supabase = useMemo(() => createClient(), []);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((id: string) => {
    setFlashId(id);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), 1700);
  }, []);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setBookings(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refetch();

    const channel = supabase
      .channel("public:bookings")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload) => {
          const row = payload.new as Booking;
          setBookings((prev) =>
            prev.some((b) => b.id === row.id) ? prev : [row, ...prev]
          );
          flash(row.id);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        (payload) => {
          const row = payload.new as Booking;
          setBookings((prev) => prev.map((b) => (b.id === row.id ? row : b)));
          flash(row.id);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bookings" },
        (payload) => {
          const old = payload.old as { id: string };
          setBookings((prev) => prev.filter((b) => b.id !== old.id));
        }
      )
      .subscribe();

    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  return { bookings, loading, error, flashId, refetch };
}
