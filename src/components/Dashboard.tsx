import { useEffect, useState } from "react";
import { getStreamsByUser, getStream, type Stream } from "../lib/contract";
import { toFriendlyError } from "../lib/errors";
import { StreamCard } from "./StreamCard";

interface LoadedStream {
  id: bigint;
  stream: Stream;
}

export function Dashboard({
  address,
  refreshSignal = 0,
  onStreamChanged,
}: {
  address: string;
  refreshSignal?: number; // bump to force a reload (e.g. after creating)
  onStreamChanged: () => void; // called after an action succeeds, to refresh
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
          setError(toFriendlyError(e));
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

  const incoming = streams.filter(
    ({ stream }) =>
      stream.recipient === address && stream.sender !== address,
  ).length;
  const outgoing = streams.filter(
    ({ stream }) =>
      stream.sender === address && stream.recipient !== address,
  ).length;

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">
        {incoming} incoming · {outgoing} outgoing
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {streams.map(({ id, stream }) => (
          <StreamCard
            key={id.toString()}
            id={id}
            stream={stream}
            connectedAddress={address}
            refreshSignal={refreshSignal}
            onActionComplete={onStreamChanged}
          />
        ))}
      </div>
    </div>
  );
}
