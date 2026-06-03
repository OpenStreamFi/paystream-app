import { useCallback, useEffect, useState } from "react";
import {
  isConnected as freighterIsConnected,
  isAllowed,
  requestAccess,
  getAddress,
  getNetwork,
} from "@stellar/freighter-api";
import { FREIGHTER_NETWORK } from "../config";

export interface WalletState {
  address: string | null;
  network: string | null;
  isInstalled: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  isWrongNetwork: boolean;
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

  const patch = (changes: Partial<WalletState>) =>
    setState((prev) => ({ ...prev, ...changes }));

  // On mount, silently restore the address if this site was already authorized,
  // so the connection survives a page refresh.
  useEffect(() => {
    (async () => {
      const installed = await freighterIsConnected();
      if (installed.error || !installed.isConnected) {
        patch({ isInstalled: false });
        return;
      }
      patch({ isInstalled: true });

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

  /** Prompt Freighter for access and store the returned address. */
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
        // Includes the user rejecting the popup.
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

  /** Clear local state. Freighter has no disconnect API; access is revoked in the extension. */
  const disconnect = useCallback(() => {
    setState({ ...initialState, isInstalled: state.isInstalled });
  }, [state.isInstalled]);

  const isWrongNetwork =
    state.address !== null &&
    state.network !== null &&
    state.network !== FREIGHTER_NETWORK;

  return { ...state, connect, disconnect, isWrongNetwork };
}
