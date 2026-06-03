// Action buttons for a stream, gated by the connected wallet's role and the
// stream's status. Recipient can withdraw; sender can pause/resume/cancel.

import { useState } from "react";
import {
  withdraw,
  pauseStream,
  resumeStream,
  cancelStream,
  type Stream,
} from "../lib/contract";
import { toFriendlyError } from "../lib/errors";

export function StreamActions({
  id,
  stream,
  connectedAddress,
  claimable,
  onActionComplete,
}: {
  id: bigint;
  stream: Stream;
  connectedAddress: string;
  claimable: bigint | null;
  onActionComplete: () => void;
}) {
  // Tracks which action is in flight (also used to disable all buttons).
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A wallet can be both (self-stream), so these are independent.
  const isSender = connectedAddress === stream.sender;
  const isRecipient = connectedAddress === stream.recipient;

  const canWithdraw =
    isRecipient && claimable !== null && claimable > 0n;
  const canPause = isSender && stream.status === "Active";
  const canResume = isSender && stream.status === "Paused";
  const canCancel =
    isSender && (stream.status === "Active" || stream.status === "Paused");

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
      onActionComplete();
    } catch (e) {
      setError(toFriendlyError(e));
    } finally {
      setBusy(null);
    }
  }

  if (!canWithdraw && !canPause && !canResume && !canCancel) {
    return null;
  }

  const btn =
    "rounded-lg px-3 py-1.5 text-xs font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex flex-wrap gap-2">
        {canWithdraw && (
          <button
            disabled={busy !== null}
            onClick={() => run("withdraw", () => withdraw(id, stream.recipient))}
            className={`${btn} bg-emerald-600 hover:bg-emerald-700`}
          >
            {busy === "withdraw" ? "Withdrawing…" : "Withdraw"}
          </button>
        )}
        {canPause && (
          <button
            disabled={busy !== null}
            onClick={() => run("pause", () => pauseStream(id, stream.sender))}
            className={`${btn} bg-amber-500 hover:bg-amber-600`}
          >
            {busy === "pause" ? "Pausing…" : "Pause"}
          </button>
        )}
        {canResume && (
          <button
            disabled={busy !== null}
            onClick={() => run("resume", () => resumeStream(id, stream.sender))}
            className={`${btn} bg-indigo-600 hover:bg-indigo-700`}
          >
            {busy === "resume" ? "Resuming…" : "Resume"}
          </button>
        )}
        {canCancel && (
          <button
            disabled={busy !== null}
            onClick={() => run("cancel", () => cancelStream(id, stream.sender))}
            className={`${btn} bg-red-600 hover:bg-red-700`}
          >
            {busy === "cancel" ? "Cancelling…" : "Cancel"}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
