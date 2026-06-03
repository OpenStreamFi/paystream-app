
import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { ConnectWallet } from "./components/ConnectWallet";
import { Dashboard } from "./components/Dashboard";
import { CreateStreamForm } from "./components/CreateStreamForm";
import { CONTRACT_ID } from "./config";

function App() {
  const wallet = useWallet();

  // Bumped after a successful create to re-trigger the Dashboard fetch.
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💧</span>
            <h1 className="text-xl font-bold">PayStream</h1>
          </div>
          <ConnectWallet wallet={wallet} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-3xl font-bold tracking-tight">
          Stream payments by the second on Stellar
        </h2>
        <p className="mt-3 max-w-2xl text-gray-600">
          Connect your Freighter wallet to create and manage real-time payment
          streams secured by the PayStream Soroban contract.
        </p>

        <div className="mt-10">
          {wallet.address ? (
            <div className="space-y-10">
              <CreateStreamForm
                sender={wallet.address}
                onCreated={() => setRefresh((n) => n + 1)}
              />
              <section>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  My Streams
                </h3>
                <Dashboard address={wallet.address} refreshSignal={refresh} />
              </section>
            </div>
          ) : (
            <p className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">
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
