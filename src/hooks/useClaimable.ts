// Fetches a stream's claimable amount, polling every 10s for Active streams so
// the value visibly ticks up. Non-Active streams are fetched once (their
// claimable is static), so no interval runs.

import { useEffect, useState } from "react";
import { getClaimable, type StreamStatus } from "../lib/contract";

const POLL_MS = 10_000;

// `refreshSignal` forces an immediate refetch (e.g. right after a withdraw,
// where the status is unchanged so the deps wouldn't otherwise re-run).
export function useClaimable(
  id: bigint,
  status: StreamStatus,
  refreshSignal = 0,
) {
  const [claimable, setClaimable] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchClaimable() {
      try {
        const value = await getClaimable(id);
        if (!cancelled) {
          setClaimable(value);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load claimable.");
        }
      }
    }

    fetchClaimable();

    if (status !== "Active") {
      return () => {
        cancelled = true;
      };
    }

    const interval = setInterval(fetchClaimable, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id, status, refreshSignal]);

  return { claimable, error };
}
