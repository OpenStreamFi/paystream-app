// contract.ts — a typed, read-only client for the PayStream Soroban contract.
//
// Big idea (worth re-reading): Soroban has no "query" endpoint. To READ data we
// build a transaction that *would* call the function, then SIMULATE it instead
// of submitting. Simulation runs the contract on the RPC server and hands back
// the return value — no signing, no fees, no on-chain change. That's why we can
// use a throwaway random account as the transaction "source": it's never used.
//
// This file only contains READS. Writes (create/withdraw/pause/...) need wallet
// signing and will live elsewhere.

import {
  rpc,
  Contract,
  TransactionBuilder,
  Account,
  Keypair,
  Address,
  nativeToScVal,
  scValToNative,
  BASE_FEE,
  xdr,
} from "@stellar/stellar-sdk";
import { CONTRACT_ID, RPC_URL, NETWORK_PASSPHRASE } from "../config";

// ---------------------------------------------------------------------------
// Types — a TypeScript mirror of the contract's Rust `Stream` struct.
// Note i128 / u64 values come back from the SDK as `bigint` (JS numbers can't
// safely hold 64/128-bit integers), so we type them that way.
// ---------------------------------------------------------------------------

export type StreamStatus = "Active" | "Paused" | "Cancelled" | "Completed";

export interface Stream {
  sender: string;
  recipient: string;
  token: string;
  deposit: bigint;
  rate_per_sec: bigint;
  start_time: bigint;
  end_time: bigint;
  claimed: bigint;
  status: StreamStatus;
  pause_time: bigint;
  total_paused: bigint;
}

// ---------------------------------------------------------------------------
// Shared plumbing
// ---------------------------------------------------------------------------

// One server connection + contract handle for the whole module.
const server = new rpc.Server(RPC_URL);
const contract = new Contract(CONTRACT_ID);

// A random public key used only as the transaction source for simulations.
// It never signs anything and doesn't need to exist on-chain.
const PLACEHOLDER_PUBKEY = Keypair.random().publicKey();

// Build a transaction that calls `method` with `args`, simulate it, and return
// the raw ScVal result. Every read function below funnels through this.
async function simulateRead(method: string, args: xdr.ScVal[] = []) {
  // A fresh source account each call (sequence "0" — simulation ignores it).
  const source = new Account(PLACEHOLDER_PUBKEY, "0");

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  // Simulation can fail (bad args, contract panic e.g. "stream not found").
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed for ${method}: ${sim.error}`);
  }
  if (!sim.result) {
    throw new Error(`No result returned from ${method}`);
  }

  return sim.result.retval; // raw ScVal — caller decodes with scValToNative
}

// Rust unit enums (StreamStatus) come back as a single-element array like
// ["Active"]. Normalize to a plain string the rest of the app can switch on.
function normalizeStatus(raw: unknown): StreamStatus {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value as StreamStatus;
}

// ---------------------------------------------------------------------------
// Read functions
// ---------------------------------------------------------------------------

// get_stream_count() -> u64. Total number of streams ever created.
export async function getStreamCount(): Promise<bigint> {
  const retval = await simulateRead("get_stream_count");
  return scValToNative(retval) as bigint;
}

// get_streams_by_user(address) -> Vec<u64>. The stream IDs a given account is
// involved in (as sender OR recipient). We must hand the contract an ScVal
// "address", which `new Address(...).toScVal()` produces from a G... string.
export async function getStreamsByUser(address: string): Promise<bigint[]> {
  const addrScVal = new Address(address).toScVal();
  const retval = await simulateRead("get_streams_by_user", [addrScVal]);
  return scValToNative(retval) as bigint[];
}

// get_stream(stream_id) -> Stream. Fetch one full stream by its id. The id is a
// u64, so we encode the number/bigint with the matching ScVal type.
export async function getStream(streamId: bigint | number): Promise<Stream> {
  const idScVal = nativeToScVal(streamId, { type: "u64" });
  const retval = await simulateRead("get_stream", [idScVal]);
  const raw = scValToNative(retval) as Record<string, unknown>;

  // scValToNative already maps struct fields by name and i128/u64 -> bigint.
  // We just fix up the status enum and assert the final shape.
  return {
    ...raw,
    status: normalizeStatus(raw.status),
  } as Stream;
}
