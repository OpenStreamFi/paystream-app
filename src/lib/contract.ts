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

// Mirror of the contract's Rust `Stream`. i128/u64 fields decode to `bigint`.
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

const server = new rpc.Server(RPC_URL);
const contract = new Contract(CONTRACT_ID);

// Throwaway source for read simulations; never signs and need not exist on-chain.
const PLACEHOLDER_PUBKEY = Keypair.random().publicKey();

/** Simulate a contract call and return the raw ScVal result. */
async function simulateRead(method: string, args: xdr.ScVal[] = []) {
  const source = new Account(PLACEHOLDER_PUBKEY, "0"); // sequence ignored by simulation

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);

  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed for ${method}: ${sim.error}`);
  }
  if (!sim.result) {
    throw new Error(`No result returned from ${method}`);
  }

  return sim.result.retval;
}

/** Rust unit enums decode to a single-element array (["Active"]); flatten to a string. */
function normalizeStatus(raw: unknown): StreamStatus {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value as StreamStatus;
}

/** Total number of streams ever created. */
export async function getStreamCount(): Promise<bigint> {
  const retval = await simulateRead("get_stream_count");
  return scValToNative(retval) as bigint;
}

/** Stream IDs the given account is involved in (as sender or recipient). */
export async function getStreamsByUser(address: string): Promise<bigint[]> {
  const addrScVal = new Address(address).toScVal();
  const retval = await simulateRead("get_streams_by_user", [addrScVal]);
  const ids = scValToNative(retval) as bigint[];

  // A stream is indexed under both sender and recipient, so self-streams appear
  // twice. Dedupe so the UI never renders the same stream more than once.
  return [...new Set(ids)];
}

/** Fetch one full stream by id. */
export async function getStream(streamId: bigint | number): Promise<Stream> {
  const idScVal = nativeToScVal(streamId, { type: "u64" });
  const retval = await simulateRead("get_stream", [idScVal]);
  const raw = scValToNative(retval) as Record<string, unknown>;

  return {
    ...raw,
    status: normalizeStatus(raw.status),
  } as Stream;
}

/** Amount currently claimable (withdrawable) for a stream, in stroops. */
export async function getClaimable(
  streamId: bigint | number,
): Promise<bigint> {
  const idScVal = nativeToScVal(streamId, { type: "u64" });
  const retval = await simulateRead("get_claimable", [idScVal]);
  return scValToNative(retval) as bigint;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Build, prepare, sign (Freighter), submit, and poll a write until confirmed.
 *  Returns the successful response; `.returnValue` holds the call's return. */
async function signAndSend(
  operation: xdr.Operation,
  senderAddress: string,
): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
  // Live account gives us the correct next sequence number.
  const account = await server.getAccount(senderAddress);

  const built = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  // Simulate to attach the Soroban footprint, resource fees, and auth entries.
  const prepared = await server.prepareTransaction(built);

  // One Freighter approval signs the call AND its inner auth (e.g. the XLM transfer).
  const signed = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: senderAddress,
  });
  if (signed.error) {
    throw new Error(signed.error.message);
  }

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

  // "PENDING" only means queued, so poll for a final status.
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

export interface CreateStreamParams {
  sender: string;
  recipient: string;
  deposit: bigint; // stroops (XLM * 10^7)
  startTime: number; // unix seconds
  endTime: number; // unix seconds
}

/** Create a stream paying native XLM, returning the new stream_id. */
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

  if (result.returnValue) {
    return scValToNative(result.returnValue) as bigint;
  }
  throw new Error("Stream created but no id was returned.");
}
