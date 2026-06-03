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
  type Transaction,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";
import {
  CONTRACT_ID,
  RPC_URL,
  NETWORK_PASSPHRASE,
  XLM_SAC,
} from "../config";

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

// ---------------------------------------------------------------------------
// Write plumbing
//
// Unlike reads, writes change on-chain state, so they must be SIGNED by the
// user's wallet and SUBMITTED (not just simulated). signAndSend is the reusable
// engine; every write (create now, withdraw/pause/... later) flows through it.
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Build -> prepare -> sign (Freighter) -> submit -> poll until confirmed.
// Returns the successful transaction response; `.returnValue` holds whatever
// the contract function returned (e.g. the new stream_id for create_stream).
async function signAndSend(
  operation: xdr.Operation,
  senderAddress: string,
): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
  // 1. Fetch the sender's live account so we use the correct sequence number.
  const account = await server.getAccount(senderAddress);

  // 2. Build the transaction with the user as the source (the fee payer).
  const built = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  // 3. Prepare: simulate to attach the Soroban footprint, resource fees, and
  //    authorization entries. Returns a new, ready-to-sign transaction.
  const prepared = await server.prepareTransaction(built);

  // 4. Sign with Freighter. One approval covers the call AND its inner auth
  //    (e.g. the XLM transfer create_stream triggers). Returns signed XDR.
  const signed = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: senderAddress,
  });
  if (signed.error) {
    throw new Error(signed.error.message);
  }

  // 5. Turn the signed XDR back into a Transaction and submit it.
  const signedTx = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    NETWORK_PASSPHRASE,
  ) as Transaction;

  const sent = await server.sendTransaction(signedTx);
  if (sent.status === "ERROR") {
    throw new Error(
      `Transaction submission failed: ${JSON.stringify(sent.errorResult)}`,
    );
  }

  // 6. Poll until the network confirms (SUCCESS) or rejects (FAILED). "PENDING"
  //    only means accepted into the queue, so we wait for a final status.
  const TIMEOUT_MS = 30_000;
  const start = Date.now();
  let result = await server.getTransaction(sent.hash);
  while (result.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    if (Date.now() - start > TIMEOUT_MS) {
      throw new Error("Timed out waiting for transaction confirmation.");
    }
    await sleep(1000);
    result = await server.getTransaction(sent.hash);
  }

  if (result.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error("Transaction failed on chain.");
  }
  return result;
}

// ---------------------------------------------------------------------------
// Write functions
// ---------------------------------------------------------------------------

export interface CreateStreamParams {
  sender: string; // connected wallet (G...) — pays the deposit + fees
  recipient: string; // who receives the stream (G...)
  deposit: bigint; // amount in stroops (XLM * 10^7), already converted
  startTime: number; // unix seconds
  endTime: number; // unix seconds (must be > startTime and in the future)
}

// create_stream(sender, recipient, token, deposit, start_time, end_time) -> u64
// Token is fixed to the native XLM SAC for now. Returns the new stream_id.
export async function createStream(
  params: CreateStreamParams,
): Promise<bigint> {
  const op = contract.call(
    "create_stream",
    new Address(params.sender).toScVal(),
    new Address(params.recipient).toScVal(),
    new Address(XLM_SAC).toScVal(),
    nativeToScVal(params.deposit, { type: "i128" }),
    nativeToScVal(params.startTime, { type: "u64" }),
    nativeToScVal(params.endTime, { type: "u64" }),
  );

  const result = await signAndSend(op, params.sender);

  // create_stream returns the new stream_id (u64 -> bigint).
  if (result.returnValue) {
    return scValToNative(result.returnValue) as bigint;
  }
  throw new Error("Stream created but no id was returned.");
}
