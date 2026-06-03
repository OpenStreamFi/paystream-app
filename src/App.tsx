
import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { ConnectWallet } from "./components/ConnectWallet";
import { Dashboard } from "./components/Dashboard";
import { CreateStreamForm } from "./components/CreateStreamForm";
import { Landing } from "./components/Landing";
import { Footer } from "./components/Footer";

function App() {
  const wallet = useWallet();

  // Bumped after a successful create to re-trigger the Dashboard fetch.
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">PayStream</h1>
          </div>
          <ConnectWallet wallet={wallet} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[900px] flex-1 px-6 py-12">
        {wallet.address ? (
          <>
            <h2 className="text-3xl font-bold tracking-tight">
              Stream payments by the second on Stellar
            </h2>
            <p className="mt-3 max-w-2xl text-gray-600">
              Create and manage real-time payment streams secured by the
              PayStream Soroban contract.
            </p>

            <div className="mt-10 space-y-16">
              <CreateStreamForm
                sender={wallet.address}
                onCreated={() => setRefresh((n) => n + 1)}
              />
              <section>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  My Streams
                </h3>
                <Dashboard
                  address={wallet.address}
                  refreshSignal={refresh}
                  onStreamChanged={() => setRefresh((n) => n + 1)}
                />
              </section>
            </div>
          </>
        ) : (
          <Landing wallet={wallet} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
