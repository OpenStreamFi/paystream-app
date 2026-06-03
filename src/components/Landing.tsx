// Marketing landing shown when no wallet is connected. Explains the protocol
// to first-time visitors and offers a Connect / Install CTA. Reuses the same
// useWallet actions as the header button — no separate wallet logic.

import type { UseWalletReturn } from "../hooks/useWallet";

const STEPS = [
  {
    n: 1,
    title: "Connect your wallet",
    body: "Link your Freighter wallet on Stellar testnet. Nothing happens on-chain until you approve it.",
  },
  {
    n: 2,
    title: "Create a stream",
    body: "Enter a recipient, an amount of XLM, and a duration. The deposit locks into the contract.",
  },
  {
    n: 3,
    title: "Funds stream per second",
    body: "The recipient's balance grows every second and they can withdraw anytime. Pause, resume, or cancel whenever you like.",
  },
];

const FEATURES = [
  {
    title: "Real-time streaming",
    body: "Money moves per second, not per month. Earnings accrue continuously the moment a stream starts.",
  },
  {
    title: "Non-custodial",
    body: "Funds are locked in an audited Soroban smart contract — never held by us or any middleman.",
  },
  {
    title: "Low fees",
    body: "Built on Stellar, where transactions settle in seconds for a fraction of a cent.",
  },
  {
    title: "Open source",
    body: "MIT-licensed contract and frontend. Fork it, audit it, and build your own streaming app.",
  },
];

export function Landing({ wallet }: { wallet: UseWalletReturn }) {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="pt-6 text-center">
        <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          Payment streaming on Stellar
        </span>
        <h2 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Stream payments by the second
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
          PayStream turns a one-time deposit into a continuous flow of money.
          Lock XLM into a smart contract and it drips to the recipient every
          second over the duration you choose. The recipient withdraws whenever
          they want; you can pause, resume, or cancel at any time — all on-chain,
          no intermediaries.
        </p>

        <div className="mt-8 flex flex-col items-center gap-2">
          {!wallet.isInstalled ? (
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-amber-500 px-6 py-3 font-medium text-white transition hover:bg-amber-600"
            >
              Install Freighter to get started
            </a>
          ) : (
            <button
              onClick={wallet.connect}
              disabled={wallet.isConnecting}
              className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {wallet.isConnecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
          <p className="text-xs text-gray-400">
            Runs on Stellar testnet — no real funds required.
          </p>
          {wallet.error && (
            <p className="text-xs text-red-600">{wallet.error}</p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h3 className="text-center text-2xl font-bold text-gray-900">
          How it works
        </h3>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-xl border border-gray-200 bg-white p-6"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                {step.n}
              </div>
              <h4 className="mt-4 font-semibold text-gray-900">{step.title}</h4>
              <p className="mt-2 text-sm text-gray-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h3 className="text-center text-2xl font-bold text-gray-900">
          Why PayStream
        </h3>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-200 bg-white p-6"
            >
              <h4 className="font-semibold text-gray-900">{feature.title}</h4>
              <p className="mt-2 text-sm text-gray-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
