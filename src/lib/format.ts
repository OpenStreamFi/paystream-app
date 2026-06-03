
/** Shorten an address to "GABC…3456" for display. */
export function shortenAddress(addr: string, chars = 4): string {
  if (addr.length <= chars * 2 + 1) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

/** Format a raw token amount (integer scaled by `decimals`) as a human string. */
export function formatTokenAmount(raw: bigint, decimals = 7): string {
  const negative = raw < 0n;
  const abs = negative ? -raw : raw;
  const base = 10n ** BigInt(decimals);

  const whole = abs / base;
  const fraction = abs % base;
  const fractionStr = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");

  const body = fractionStr ? `${whole}.${fractionStr}` : `${whole}`;
  return negative ? `-${body}` : body;
}

/** Parse a human XLM string ("1.5") into stroops. Uses string math, never floats,
 *  to avoid precision loss. Throws on invalid input or excess decimal places. */
export function xlmToStroops(input: string, decimals = 7): bigint {
  const trimmed = input.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Enter a valid positive amount (e.g. 1.5).");
  }

  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) {
    throw new Error(`At most ${decimals} decimal places are allowed.`);
  }

  const paddedFraction = fraction.padEnd(decimals, "0");
  const stroops = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(paddedFraction);

  if (stroops <= 0n) {
    throw new Error("Amount must be greater than zero.");
  }
  return stroops;
}
