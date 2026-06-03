import { useState, type SyntheticEvent } from "react";
import { StrKey } from "@stellar/stellar-sdk";
import { createStream } from "../lib/contract";
import { xlmToStroops } from "../lib/format";
import { toFriendlyError } from "../lib/errors";

const SECONDS_PER_DAY = 86_400;

export function CreateStreamForm({
  sender,
  onCreated,
}: {
  sender: string;
  onCreated: (id: bigint) => void;
}) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    let deposit: bigint;
    let startTime: number;
    let endTime: number;
    try {
      if (!StrKey.isValidEd25519PublicKey(recipient.trim())) {
        throw new Error("Recipient is not a valid Stellar address (G...).");
      }

      deposit = xlmToStroops(amount);

      const numDays = Number(days);
      if (!Number.isFinite(numDays) || numDays <= 0) {
        throw new Error("Duration must be a positive number of days.");
      }

      startTime = Math.floor(Date.now() / 1000);
      endTime = startTime + Math.round(numDays * SECONDS_PER_DAY);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid input.");
      return;
    }

    setSubmitting(true);
    try {
      const id = await createStream({
        sender,
        recipient: recipient.trim(),
        deposit,
        startTime,
        endTime,
      });
      setSuccess(`Stream #${id.toString()} created.`);
      setRecipient("");
      setAmount("");
      setDays("");
      onCreated(id);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900">Create a stream</h3>
      <p className="mt-1 text-sm text-gray-500">
        Streams native XLM to the recipient over the chosen duration.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Recipient address
          </label>
          <input
            className={inputClass}
            placeholder="G..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Amount (XLM)
          </label>
          <input
            className={inputClass}
            placeholder="10"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Duration (days)
          </label>
          <input
            className={inputClass}
            placeholder="30"
            inputMode="decimal"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Confirming… (approve in Freighter)" : "Create Stream"}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}
    </form>
  );
}
