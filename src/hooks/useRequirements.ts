"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Requirement } from "@/lib/types";

interface UseRequirementsResult {
  requirements: Requirement[];
  open: Requirement[];
  fulfilled: Requirement[];
  loading: boolean;
  error: string | null;
}

/**
 * Loads all yarn requirements and keeps them in sync in realtime, so the
 * procurement board updates instantly for everyone.
 */
export function useRequirements(): UseRequirementsResult {
  const supabase = useMemo(() => createClient(), []);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("requirements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else {
      setError(null);
      setRequirements(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refetch();

    const channel = supabase
      .channel("public:requirements")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "requirements" },
        (payload) => {
          const row = payload.new as Requirement;
          setRequirements((prev) =>
            prev.some((r) => r.id === row.id) ? prev : [row, ...prev]
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "requirements" },
        (payload) => {
          const row = payload.new as Requirement;
          setRequirements((prev) => prev.map((r) => (r.id === row.id ? row : r)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "requirements" },
        (payload) => {
          const old = payload.old as { id: string };
          setRequirements((prev) => prev.filter((r) => r.id !== old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const { open, fulfilled } = useMemo(() => {
    const open: Requirement[] = [];
    const fulfilled: Requirement[] = [];
    for (const r of requirements) (r.fulfilled ? fulfilled : open).push(r);
    return { open, fulfilled };
  }, [requirements]);

  return { requirements, open, fulfilled, loading, error };
}
