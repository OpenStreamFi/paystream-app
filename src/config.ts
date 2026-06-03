
import { Networks } from "@stellar/stellar-sdk";

export const CONTRACT_ID =
  "CC2SUYO3WFVMER3SKBUWM3JVI7P4OL73YD6NHWWUAN5OPY4AV46POAWE";

export const RPC_URL = "https://soroban-testnet.stellar.org";

// Identifies the network a transaction is signed against (prevents cross-network replay).
export const NETWORK_PASSPHRASE = Networks.TESTNET;

// Label Freighter reports ("TESTNET" / "PUBLIC"); used to detect wrong-network wallets.
export const FREIGHTER_NETWORK = "TESTNET";

// Stellar Asset Contract for native XLM: the bridge that gives classic XLM a
// Soroban token interface so contracts can move it by address. Deterministic,
// derived from Asset.native().contractId(Networks.TESTNET).
export const XLM_SAC =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

// 1 XLM = 10_000_000 stroops.
export const XLM_DECIMALS = 7;
