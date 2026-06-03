// useWallet — a custom React hook that wraps all Freighter wallet logic.
//
// Why a hook? So any component can do `const { address, connect } = useWallet()`
// without knowing anything about Freighter's API. All the messy details
// (is the extension installed? is it on the right network? did the user reject
// the popup?) live here in one place.

import { useCallback, useEffect, useState } from "react";
import {
  isConnected as freighterIsConnected,
  isAllowed,
  requestAccess,
  getAddress,
  getNetwork,
} from "@stellar/freighter-api";
import { FREIGHTER_NETWORK } from "../config";

// All the pieces of "wallet state" a component might care about.
export interface WalletState {
  address: string | null; // the connected G... public key, or null
  network: string | null; // "TESTNET" / "PUBLIC" as reported by Freighter
  isInstalled: boolean; // is the Freighter extension present in this browser?
  isConnecting: boolean; // true while a connect attempt is in flight
  error: string | null; // last human-readable error, if any
}

export interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  isWrongNetwork: boolean; // connected, but Freighter is not on TESTNET
}

const initialState: WalletState = {
  address: null,
  network: null,
  isInstalled: false,
  isConnecting: false,
  error: null,
};

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>(initialState);

  // Small helper so we can update just a few fields without rewriting the whole object.
  const patch = (changes: Partial<WalletState>) =>
    setState((prev) => ({ ...prev, ...changes }));

  // On first mount: check if Freighter is installed, and if the user has
  // *already* authorized this site before, silently restore their address.
  // This is what makes the wallet "stay connected" across page refreshes.
  useEffect(() => {
    (async () => {
      const installed = await freighterIsConnected();
      if (installed.error || !installed.isConnected) {
        patch({ isInstalled: false });
        return;
      }
      patch({ isInstalled: true });

      // isAllowed = has THIS website been granted access before?
      const allowed = await isAllowed();
      if (allowed.isAllowed && !allowed.error) {
        const addr = await getAddress();
        const net = await getNetwork();
        if (!addr.error && addr.address) {
          patch({ address: addr.address, network: net.network ?? null });
        }
      }
    })();
  }, []);

  // connect() — called when the user clicks the "Connect Wallet" button.
  // requestAccess() pops the Freighter approval dialog (or returns the address
  // immediately if already approved).
  const connect = useCallback(async () => {
    patch({ isConnecting: true, error: null });
    try {
      const installed = await freighterIsConnected();
      if (installed.error || !installed.isConnected) {
        patch({
          isConnecting: false,
          error: "Freighter not detected. Install the extension first.",
        });
        return;
      }

      const access = await requestAccess();
      if (access.error) {
        // The user clicked "Reject" in the popup, or something else failed.
        patch({ isConnecting: false, error: access.error.message });
        return;
      }

      const net = await getNetwork();
      patch({
        address: access.address,
        network: net.network ?? null,
        isInstalled: true,
        isConnecting: false,
      });
    } catch (e) {
      patch({
        isConnecting: false,
        error: e instanceof Error ? e.message : "Failed to connect wallet.",
      });
    }
  }, []);

  // disconnect() — Freighter has no real "disconnect" API (the user revokes
  // access from the extension itself). So we just clear our local state, which
  // makes the UI behave as logged-out.
  const disconnect = useCallback(() => {
    setState({ ...initialState, isInstalled: state.isInstalled });
  }, [state.isInstalled]);

  // Derived flag: are we connected but pointed at the wrong network?
  const isWrongNetwork =
    state.address !== null &&
    state.network !== null &&
    state.network !== FREIGHTER_NETWORK;

  return { ...state, connect, disconnect, isWrongNetwork };
}
