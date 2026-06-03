import type { Stream, StreamStatus } from "../lib/contract";
import { shortenAddress, formatTokenAmount } from "../lib/format";
import { useClaimable } from "../hooks/useClaimable";

const STATUS_STYLES: Record<StreamStatus, string> = {
  Active: "bg-emerald-100 text-emerald-800",
  Paused: "bg-amber-100 text-amber-800",
  Cancelled: "bg-red-100 text-red-800",
  Completed: "bg-gray-200 text-gray-700",
};

export function StreamCard({ id, stream }: { id: bigint; stream: Stream }) {
  const { claimable, error: claimableError } = useClaimable(id, stream.status);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">
          Stream #{id.toString()}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[stream.status]}`}
        >
          {stream.status}
        </span>
      </div>

      <div className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">From</span>
          <span className="font-mono text-gray-800">
            {shortenAddress(stream.sender)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">To</span>
          <span className="font-mono text-gray-800">
            {shortenAddress(stream.recipient)}
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Deposit</span>
          <span className="font-medium text-gray-900">
            {formatTokenAmount(stream.deposit)}
          </span>
        </div>

        <div className="mt-1 flex justify-between">
          <span className="text-gray-500">
            Claimable
            {stream.status === "Active" && (
              <span className="ml-1 text-xs text-emerald-600">● live</span>
            )}
          </span>
          <span className="font-medium text-gray-900">
            {claimableError
              ? "—"
              : claimable === null
                ? "…"
                : formatTokenAmount(claimable)}
          </span>
        </div>
      </div>
    </div>
  );
}
