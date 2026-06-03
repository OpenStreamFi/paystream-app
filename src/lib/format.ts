// format.ts — tiny display helpers shared across the UI.
// Pure functions: no React, no network. Easy to reason about and reuse.

// "GABC...XYZ123456" -> "GABC…3456" so long keys fit in the UI.
export function shortenAddress(addr: string, chars = 4): string {
  if (addr.length <= chars * 2 + 1) return addr;
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}

// Soroban tokens store amounts as integers scaled by the token's decimals.
// The Stellar default (XLM, most USDC issuances) is 7 decimals, so the raw
// value 10_000_000 means 1.0 tokens. We don't fetch the real decimals yet,
// so this defaults to 7 and stays a parameter we can correct later.
export function formatTokenAmount(raw: bigint, decimals = 7): string {
  const negative = raw < 0n;
  const abs = negative ? -raw : raw;
  const base = 10n ** BigInt(decimals);

  const whole = abs / base; // integer part
  const fraction = abs % base; // leftover, still scaled

  // Pad the fraction to full width, then trim trailing zeros for readability.
  const fractionStr = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");

  const body = fractionStr ? `${whole}.${fractionStr}` : `${whole}`;
  return negative ? `-${body}` : body;
}
