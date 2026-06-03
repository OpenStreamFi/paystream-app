// ConnectWallet — the button + status UI for wallet connection.
// It reads everything from the useWallet hook and just renders the right
// state. No Freighter calls happen here directly.

import type { UseWalletReturn } from "../hooks/useWallet";
import { shortenAddress } from "../lib/format";

export function ConnectWallet({ wallet }: { wallet: UseWalletReturn }) {
  const {
    address,
    isInstalled,
    isConnecting,
    error,
    isWrongNetwork,
    connect,
    disconnect,
  } = wallet;

  // Case 1: extension isn't installed — point them to the download page.
  if (!isInstalled) {
    return (
      <a
        href="https://www.freighter.app/"
        target="_blank"
        rel="noreferrer"
        className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white transition hover:bg-amber-600"
      >
        Install Freighter
      </a>
    );
  }

  // Case 2: connected — show the address + a disconnect button.
  if (address) {
    return (
      <div className="flex items-center gap-3">
        {isWrongNetwork && (
          <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
            Wrong network — switch Freighter to Testnet
          </span>
        )}
        <span className="rounded-lg bg-emerald-100 px-3 py-2 font-mono text-sm text-emerald-800">
          {shortenAddress(address)}
        </span>
        <button
          onClick={disconnect}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Case 3: installed but not connected — show the connect button (+ any error).
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connect}
        disabled={isConnecting}
        className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
