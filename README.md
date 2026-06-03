# paystream-app

[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-7D00FF?logo=stellar)](https://stellar.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vite.dev)

**The frontend dashboard for PayStream — open-source, real-time payment streaming on Stellar.**

Create, manage, and monitor per-second payment streams directly from your browser. No CLI, no manual transaction crafting — just connect a wallet and stream. Built on the [soroban-paystream](https://github.com/OpenStreamFi/soroban-paystream) smart contract.

[Overview](#overview) • [Features](#features) • [Architecture](#architecture) • [Getting Started](#getting-started) • [Project Structure](#project-structure) • [Contributing](#contributing)

---

## Overview

**paystream-app** is the React + TypeScript frontend for the PayStream protocol. It talks directly to the deployed Soroban smart contract on Stellar and lets anyone create and manage payment streams without touching the command line.

A **stream** is a time-locked token deposit that drips into a recipient's claimable balance every second over a fixed window:

- The **recipient** can withdraw their accrued balance at any time.
- The **sender** can pause, resume, or cancel at any time.
- Nothing is escrowed off-chain and no balances are moved on a timer — the contract computes the claimable amount *on demand* from elapsed time. Only create, withdraw, and cancel cost gas.

Everything happens on-chain. This app is purely the interface: reads are simulated against the RPC (no gas, no signing), and writes are signed in your wallet and submitted to the network.

> **Token:** The app currently streams **native XLM** via its Stellar Asset Contract. The underlying `soroban-paystream` contract is token-agnostic and accepts any Soroban token address, so multi-asset support is a natural future extension.

### Live Contract

The app connects to the PayStream contract deployed on **Stellar testnet**:

```
CC2SUYO3WFVMER3SKBUWM3JVI7P4OL73YD6NHWWUAN5OPY4AV46POAWE
```

---

## Features

- **Wallet connection** via Freighter, with auto-reconnect on page refresh
- **Wrong-network detection** — warns you if Freighter is pointed at mainnet
- **Create streams** by entering a recipient address, amount, and duration in days
- **Personal dashboard** showing every stream where you are the sender *or* the recipient
- **Live claimable balance** that refreshes every 10 seconds on active streams
- **Per-second rate** displayed on each stream card
- **Role-gated actions** — withdraw for recipients; pause, resume, and cancel for senders
- **Human-readable errors** mapped from every contract error code
- **At-a-glance details** — duration and start/end date range on each card

---

## Architecture

```
paystream-app/
│
├── src/
│   ├── config.ts                ← contract ID, RPC URL, network config
│   ├── lib/
│   │   ├── contract.ts          ← all contract reads and writes
│   │   ├── format.ts            ← address, amount, duration formatters
│   │   └── errors.ts            ← contract error code → message map
│   ├── hooks/
│   │   ├── useWallet.ts         ← Freighter wallet connection state
│   │   └── useClaimable.ts      ← live claimable polling hook
│   └── components/
│       ├── ConnectWallet.tsx    ← wallet button and state display
│       ├── Dashboard.tsx        ← fetches and renders all user streams
│       ├── StreamCard.tsx       ← single stream display
│       ├── StreamActions.tsx    ← withdraw, pause, resume, cancel buttons
│       └── CreateStreamForm.tsx ← new stream form
```

The codebase follows a strict **layering** rule that keeps it approachable for new contributors:

- **`lib/`** — pure, framework-free logic. Contract calls, formatting, error mapping. No React.
- **`hooks/`** — stateful React logic. Wallet state, polling. No markup.
- **`components/`** — presentational. They receive data and render it; data fetching lives in hooks or `Dashboard.tsx`.

### How Reads and Writes Work

Soroban has no separate "query" endpoint — *everything* is a transaction. The difference is whether we submit it.

```
Read   (get_stream, get_claimable, get_streams_by_user, ...)
  → build operation
  → simulate against the RPC
  → decode the result
  ⇒ no gas, no signing, no wallet required

Write  (create_stream, withdraw, pause, resume, cancel)
  → build operation with the sender's real sequence number
  → prepare transaction (Soroban footprint + resource fees + auth)
  → sign with Freighter
  → submit to the network
  → poll until confirmed
```

---

## Getting Started

### Prerequisites

- **Node.js 20+**
- The [Freighter wallet](https://freighter.app) browser extension
- A funded Stellar **testnet** account

### Install and Run

```bash
git clone https://github.com/OpenStreamFi/paystream-app.git
cd paystream-app
pnpm install
pnpm dev
```

Open **http://localhost:5173** in the browser that has Freighter installed.

### Fund Your Testnet Account

If your Freighter wallet has no testnet XLM, visit Friendbot with your public key:

```
https://friendbot.stellar.org/?addr=YOUR_G_ADDRESS
```

Friendbot sends 10,000 free testnet XLM instantly.

### Switch Freighter to Testnet

In Freighter, go to **Settings → Network → Testnet**. The app displays a warning banner if your wallet is on the wrong network.

---

## Project Structure

| File | Purpose |
|---|---|
| `src/config.ts` | Single source for contract ID, RPC URL, and network passphrase |
| `src/lib/contract.ts` | All contract interactions — reads via simulate, writes via sign-and-submit |
| `src/lib/format.ts` | Pure formatting functions for addresses, amounts, and durations |
| `src/lib/errors.ts` | Maps contract error codes to human-readable messages |
| `src/hooks/useWallet.ts` | Freighter connection, auto-reconnect, and network check |
| `src/hooks/useClaimable.ts` | Polls `get_claimable` every 10s for active streams only |
| `src/components/Dashboard.tsx` | Fetches stream IDs, then loads all streams in parallel |
| `src/components/StreamCard.tsx` | Displays one stream with live claimable and action buttons |
| `src/components/StreamActions.tsx` | Role-gated buttons based on the connected wallet address |
| `src/components/CreateStreamForm.tsx` | Form to create a new stream, with input validation |

---

## Tech Stack

- **[React 19](https://react.dev)** + **[TypeScript](https://www.typescriptlang.org)**
- **[Vite](https://vite.dev)** for dev server and builds
- **[Tailwind CSS v4](https://tailwindcss.com)** for styling
- **[@stellar/stellar-sdk](https://github.com/stellar/js-stellar-sdk)** for network calls and transaction building
- **[@stellar/freighter-api](https://www.freighter.app)** for wallet connection and signing

---

## Contributing

Contributions are welcome across every area — React components, TypeScript, Tailwind styling, testing, documentation, and accessibility.

Issues are labeled by difficulty. **Good first issues** are scoped for contributors new to the project and require no knowledge of the Soroban contract.

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for the full workflow.

### Commit Convention

| Prefix | Use for |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `test:` | Adding or updating tests |
| `docs:` | Documentation changes |
| `chore:` | Tooling, CI, config |
| `refactor:` | Code restructuring |

---

## Related

- **[soroban-paystream](https://github.com/OpenStreamFi/soroban-paystream)** — the Soroban smart contract this app connects to
- **[OpenStreamFi](https://github.com/OpenStreamFi)** — the GitHub organization

---

## License

Released under the [MIT License](./LICENSE).
