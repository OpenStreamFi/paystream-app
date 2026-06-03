// Global site footer: brand, resource links, on-chain details, and legal bar.

import { CONTRACT_ID } from "../config";

const EXPLORER_URL = `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`;

const RESOURCES = [
  { label: "Frontend (paystream-app)", href: "https://github.com/OpenStreamFi/paystream-app" },
  { label: "Contract (soroban-paystream)", href: "https://github.com/OpenStreamFi/soroban-paystream" },
  { label: "OpenStreamFi org", href: "https://github.com/OpenStreamFi" },
  { label: "Get Freighter", href: "https://www.freighter.app/" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-[900px] px-6 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <h2 className="text-lg font-bold text-gray-900">PayStream</h2>
            <p className="mt-2 text-sm text-gray-600">
              Open-source, real-time payment streaming on Stellar. Stream value
              by the second — non-custodial and on-chain.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Resources
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {RESOURCES.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-600 transition hover:text-indigo-600"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* On-chain */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              On-chain
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="flex items-center gap-2 text-gray-600">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Stellar Testnet
              </p>
              <div>
                <p className="text-gray-500">Contract</p>
                <a
                  href={EXPLORER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="block break-all font-mono text-xs text-gray-600 transition hover:text-indigo-600"
                >
                  {CONTRACT_ID}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Legal bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-gray-100 pt-6 text-xs text-gray-400 sm:flex-row">
          <p>© {year} PayStream · MIT License</p>
          <p>Built on Stellar · Soroban</p>
        </div>
      </div>
    </footer>
  );
}
