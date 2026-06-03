// App — the top-level layout. For this first step it's just a header with the
// wallet button and a panel that reflects the connection state. Everything
// else (creating streams, withdrawing, etc.) will hang off this later.

import { useWallet } from "./hooks/useWallet";
import { ConnectWallet } from "./components/ConnectWallet";
import { CONTRACT_ID } from "./config";

function App() {
  // One call gives us the whole wallet API. We pass it down to ConnectWallet
  // so there's a single source of truth for "who is connected".
  const wallet = useWallet();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💧</span>
            <h1 className="text-xl font-bold">PayStream</h1>
          </div>
          <ConnectWallet wallet={wallet} />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-3xl font-bold tracking-tight">
          Stream payments by the second on Stellar
        </h2>
        <p className="mt-3 max-w-2xl text-gray-600">
          Connect your Freighter wallet to create and manage real-time payment
          streams secured by the PayStream Soroban contract.
        </p>

        {/* Connection-state panel — proves the wallet wiring works end to end. */}
        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
          {wallet.address ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-emerald-700">
                ✓ Wallet connected
              </p>
              <p className="font-mono text-sm break-all text-gray-700">
                {wallet.address}
              </p>
              <p className="text-sm text-gray-500">
                Network:{" "}
                <span className="font-medium">{wallet.network ?? "unknown"}</span>
              </p>
            </div>
          ) : (
            <p className="text-gray-500">
              No wallet connected yet. Click{" "}
              <span className="font-medium">Connect Wallet</span> in the top right
              to get started.
            </p>
          )}
        </div>

        <p className="mt-8 text-xs text-gray-400">
          Contract (testnet):{" "}
          <span className="font-mono">{CONTRACT_ID}</span>
        </p>
      </main>
    </div>
  );
}

export default App;
