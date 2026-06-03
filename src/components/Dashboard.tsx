// Dashboard — lists every stream the connected wallet is involved in.
// Data flow: address -> getStreamsByUser -> [ids] -> getStream(id) for each.

import { useEffect, useState } from "react";
import { getStreamsByUser, getStream, type Stream } from "../lib/contract";
import { StreamCard } from "./StreamCard";

// We keep the id alongside the stream because cards need to show "Stream #id".
interface LoadedStream {
  id: bigint;
  stream: Stream;
}

export function Dashboard({
  address,
  refreshSignal = 0,
}: {
  address: string;
  refreshSignal?: number; // bump this to force a reload (e.g. after creating)
}) {
  const [streams, setStreams] = useState<LoadedStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // `cancelled` flips to true if this effect re-runs (address changed) or the
    // component unmounts, so a slow fetch can't overwrite newer state.
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const ids = await getStreamsByUser(address);

        // Fetch all stream structs at once instead of sequentially.
        const loaded = await Promise.all(
          ids.map(async (id) => ({ id, stream: await getStream(id) })),
        );

        if (!cancelled) setStreams(loaded);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load streams.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, refreshSignal]);

  if (loading) {
    return <p className="text-gray-500">Loading your streams…</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (streams.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-gray-500">
        No streams yet. Once you create one, it'll show up here.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {streams.map(({ id, stream }) => (
        <StreamCard key={id.toString()} id={id} stream={stream} />
      ))}
    </div>
  );
}
