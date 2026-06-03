// Maps PayStream contract error codes to friendly, one-sentence messages.
// Contract errors surface in SDK messages as "Error(Contract, #<code>)".

const CONTRACT_ERRORS: Record<number, string> = {
  1: "Stream not found.",
  2: "Your wallet is not authorized to perform this action.",
  3: "This stream has already ended or been cancelled.",
  4: "This stream is already paused.",
  5: "This stream is not paused.",
  6: "Nothing to withdraw yet — check back soon.",
  7: "The amount entered is invalid.",
  8: "The start and end times are invalid.",
  9: "This stream has already ended.",
};

/** Turn any thrown error into a user-facing message, mapping known contract codes. */
export function toFriendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  const match = message.match(/Error\(Contract,\s*#(\d+)\)/);
  if (match) {
    const code = Number(match[1]);
    return CONTRACT_ERRORS[code] ?? "The contract rejected this action.";
  }

  return message;
}
