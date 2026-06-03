import { useEffect, useState } from "react";
import { getStreamsByUser, getStream, type Stream } from "../lib/contract";
import { StreamCard } from "./StreamCard";

interface LoadedStream {
  id: bigint;
  stream: Stream;
}

export function Dashboard({
  address,
  refreshSignal = 0,
}: {
  address: string;
  refreshSignal?: number; // bump to force a reload (e.g. after creating)
}) {
  const [streams, setStreams] = useState<LoadedStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guard against a slow fetch overwriting newer state after address change/unmount.
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const ids = await getStreamsByUser(address);
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
