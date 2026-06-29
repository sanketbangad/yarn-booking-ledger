"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Godown } from "@/lib/types";

interface UseGodownsResult {
  godowns: Godown[];
  loading: boolean;
  /** Adds a godown (or returns the existing one with the same name). */
  addGodown: (name: string) => Promise<string | null>;
}

export function useGodowns(): UseGodownsResult {
  const supabase = useMemo(() => createClient(), []);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("godowns")
      .select("*")
      .order("name", { ascending: true });
    setGodowns(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refetch();

    const channel = supabase
      .channel("public:godowns")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "godowns" },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const addGodown = useCallback(
    async (name: string): Promise<string | null> => {
      const clean = name.trim();
      if (!clean) return null;
      const existing = godowns.find(
        (g) => g.name.toLowerCase() === clean.toLowerCase()
      );
      if (existing) return existing.name;

      const { error } = await supabase.from("godowns").insert({ name: clean });
      if (error && !error.message.toLowerCase().includes("duplicate")) {
        throw error;
      }
      await refetch();
      return clean;
    },
    [supabase, godowns, refetch]
  );

  return { godowns, loading, addGodown };
}
