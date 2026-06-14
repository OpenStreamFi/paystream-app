import type { Stream, StreamStatus } from "../lib/contract";
import {
  shortenAddress,
  formatTokenAmount,
  formatDuration,
  formatDateRange,
  formatTimeRemaining,
} from "../lib/format";
import { useClaimable } from "../hooks/useClaimable";
import { StreamActions } from "./StreamActions";
import { CopyButton } from "./CopyButton";

const STATUS_STYLES: Record<StreamStatus, string> = {
  Active: "bg-emerald-100 text-emerald-800",
  Paused: "bg-amber-100 text-amber-800",
  Cancelled: "bg-red-100 text-red-800",
  Completed: "bg-gray-200 text-gray-700",
};

export function StreamCard({
  id,
  stream,
  connectedAddress,
  refreshSignal,
  onActionComplete,
}: {
  id: bigint;
  stream: Stream;
  connectedAddress: string;
  refreshSignal: number;
  onActionComplete: () => void;
}) {
  // The contract only flips Active → Completed when someone withdraws after the
  // end. Until then an elapsed stream still reads as "Active" on-chain, so we
  // derive the real state from end_time for display, polling, and actions.
  const nowSec = Math.floor(Date.now() / 1000);
  const ended =
    (stream.status === "Active" || stream.status === "Paused") &&
    nowSec >= Number(stream.end_time);
  const effectiveStatus: StreamStatus = ended ? "Completed" : stream.status;
  const statusLabel = ended ? "Ended" : stream.status;

  const { claimable, error: claimableError } = useClaimable(
    id,
    effectiveStatus,
    refreshSignal,
  );

  const isSender = connectedAddress === stream.sender;
  const isRecipient = connectedAddress === stream.recipient;

  // Direction relative to the connected wallet, for the role badge.
  const role =
    isSender && isRecipient
      ? { label: "Self", style: "bg-gray-100 text-gray-600" }
      : isRecipient
        ? { label: "Incoming", style: "bg-emerald-100 text-emerald-800" }
        : isSender
          ? { label: "Outgoing", style: "bg-blue-100 text-blue-800" }
          : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-900">
              Stream #{id.toString()}
            </span>
            <CopyButton text={id.toString()} />
          </div>
          {role && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${role.style}`}
            >
              {role.label}
            </span>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[effectiveStatus]}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">From</span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-gray-800">
              {shortenAddress(stream.sender)}
            </span>
            <CopyButton text={stream.sender} />
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">To</span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-gray-800">
              {shortenAddress(stream.recipient)}
            </span>
            <CopyButton text={stream.recipient} />
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Duration</span>
          <span className="text-gray-800">
            {formatDuration(Number(stream.end_time - stream.start_time))}
          </span>
        </div>
        <div
          className="text-xs text-gray-400"
          title={formatDateRange(Number(stream.start_time), Number(stream.end_time))}
        >
          {ended || stream.status === "Completed" || stream.status === "Cancelled"
            ? "Ended"
            : formatTimeRemaining(Number(stream.end_time), nowSec)}
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Deposit</span>
          <span className="font-medium text-gray-900">
            {formatTokenAmount(stream.deposit)} XLM
          </span>
        </div>

        <div className="mt-1 flex justify-between">
          <span className="text-gray-500">Rate</span>
          <span className="text-gray-800">
            {formatTokenAmount(stream.rate_per_sec)} XLM/sec
          </span>
        </div>

        <div className="mt-1 flex justify-between">
          <span className="text-gray-500">
            Claimable
            {effectiveStatus === "Active" && (
              <span className="ml-1 text-xs text-emerald-600">● live</span>
            )}
          </span>
          <span className="font-medium text-gray-900">
            {claimableError
              ? "—"
              : claimable === null
                ? "…"
                : `${formatTokenAmount(claimable, 7, 4)} XLM`}
          </span>
        </div>
      </div>

      <StreamActions
        id={id}
        stream={stream}
        connectedAddress={connectedAddress}
        claimable={claimable}
        ended={ended}
        onActionComplete={onActionComplete}
      />
    </div>
  );
}
