// Central place for network + contract constants.
// Keeping these in one file means there's a single spot to flip when we
// eventually point the app at mainnet instead of testnet.

import { Networks } from "@stellar/stellar-sdk";

// The deployed PayStream contract on Stellar testnet.
export const CONTRACT_ID =
  "CC2SUYO3WFVMER3SKBUWM3JVI7P4OL73YD6NHWWUAN5OPY4AV46POAWE";

// Soroban RPC endpoint — this is the server our app reads/writes through.
// Stellar runs a public testnet RPC we can use for free.
export const RPC_URL = "https://soroban-testnet.stellar.org";

// The network "passphrase" is a string that uniquely identifies a network.
// Every transaction is signed against one, so testnet and mainnet sigs can
// never be replayed across networks. Networks.TESTNET is that exact string.
export const NETWORK_PASSPHRASE = Networks.TESTNET;

// Human-readable label Freighter uses ("TESTNET" / "PUBLIC"). We check the
// wallet reports this so a user on mainnet doesn't accidentally send testnet txs.
export const FREIGHTER_NETWORK = "TESTNET";

// The Stellar Asset Contract (SAC) for native XLM on testnet. A SAC is the
// built-in bridge that gives a classic asset (XLM) a Soroban token interface
// (transfer/balance/...) so contracts can move it by address. This value is
// deterministic — derived from Asset.native().contractId(Networks.TESTNET).
export const XLM_SAC =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

// XLM (like most Stellar assets) uses 7 decimals: 1 XLM = 10_000_000 stroops.
// The form converts human XLM input to stroops with this.
export const XLM_DECIMALS = 7;
