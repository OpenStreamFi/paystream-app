
/** Shorten an address to "GABC…3456" for display. */
export function shortenAddress(addr: string, chars = 4): string {
  if (addr.length <= chars * 2 + 1) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

/** Format a raw token amount (integer scaled by `decimals`) as a human string.
 *  `maxDecimals` caps the displayed fractional digits (truncates, not rounds). */
export function formatTokenAmount(
  raw: bigint,
  decimals = 7,
  maxDecimals = decimals,
): string {
  const negative = raw < 0n;
  const abs = negative ? -raw : raw;
  const base = 10n ** BigInt(decimals);

  const whole = abs / base;
  const fraction = abs % base;
  let fractionStr = fraction.toString().padStart(decimals, "0");
  if (maxDecimals < decimals) fractionStr = fractionStr.slice(0, maxDecimals);
  fractionStr = fractionStr.replace(/0+$/, "");

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

/** Human-readable duration from a span in seconds, e.g. 86400 -> "1 day". */
export function formatDuration(seconds: number): string {
  const units: [number, string][] = [
    [86_400, "day"],
    [3_600, "hour"],
    [60, "minute"],
    [1, "second"],
  ];
  for (const [size, name] of units) {
    if (seconds >= size && seconds % size === 0) {
      const n = seconds / size;
      return `${n} ${name}${n === 1 ? "" : "s"}`;
    }
  }
  return `${seconds} seconds`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format two unix-second timestamps as "Jun 3 2026 → Jun 10 2026". */
export function formatDateRange(startSec: number, endSec: number): string {
  const fmt = (s: number) => {
    const d = new Date(s * 1000);
    return `${MONTHS[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
  };
  return `${fmt(startSec)} → ${fmt(endSec)}`;
}
