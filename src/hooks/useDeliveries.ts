"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Delivery } from "@/lib/types";

interface UseDeliveriesResult {
  deliveries: Delivery[];
  /** booking_id -> its deliveries (newest first) */
  byBooking: Map<string, Delivery[]>;
  /** booking_id -> total quantity received */
  receivedByBooking: Map<string, number>;
  loading: boolean;
  error: string | null;
}

/**
 * Loads all deliveries and keeps them in sync in realtime, so pending
 * quantities update instantly for everyone when a receipt is recorded.
 */
export function useDeliveries(): UseDeliveriesResult {
  const supabase = useMemo(() => createClient(), []);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("deliveries")
      .select("*")
      .order("received_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else {
      setError(null);
      setDeliveries(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refetch();

    const channel = supabase
      .channel("public:deliveries")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deliveries" },
        (payload) => {
          const row = payload.new as Delivery;
          setDeliveries((prev) =>
            prev.some((d) => d.id === row.id) ? prev : [row, ...prev]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deliveries" },
        (payload) => {
          const row = payload.new as Delivery;
          setDeliveries((prev) => prev.map((d) => (d.id === row.id ? row : d)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "deliveries" },
        (payload) => {
          const old = payload.old as { id: string };
          setDeliveries((prev) => prev.filter((d) => d.id !== old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const { byBooking, receivedByBooking } = useMemo(() => {
    const byBooking = new Map<string, Delivery[]>();
    const receivedByBooking = new Map<string, number>();
    for (const d of deliveries) {
      const list = byBooking.get(d.booking_id) ?? [];
      list.push(d);
      byBooking.set(d.booking_id, list);
      receivedByBooking.set(
        d.booking_id,
        (receivedByBooking.get(d.booking_id) ?? 0) + Number(d.quantity_received)
      );
    }
    return { byBooking, receivedByBooking };
  }, [deliveries]);

  return { deliveries, byBooking, receivedByBooking, loading, error };
}
