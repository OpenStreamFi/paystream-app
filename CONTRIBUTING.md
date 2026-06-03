# Contributing to paystream-app

Thanks for your interest in contributing! This is the frontend dashboard for the **PayStream** protocol on Stellar — a real-time payment streaming dApp built on Soroban.

Whether you're fixing a bug, polishing the UI, or adding a feature, this guide walks you through the workflow.

---

## How to Contribute

1. Browse the open [Issues](https://github.com/OpenStreamFi/paystream-app/issues).
2. Comment on the issue you'd like to take — wait for a maintainer to assign it to you before starting, so two people don't duplicate work.
3. Fork the repo and create a branch: `git checkout -b feat/your-issue-name`.
4. Make your changes.
5. Run `pnpm build` and confirm it compiles with no TypeScript errors.
6. Open a Pull Request with a clear description of **what** you changed and **why**, and link the issue it closes (e.g. "Closes #12").

---

## Branch Naming

| Prefix | Use for |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `style/` | UI and styling changes |
| `docs/` | Documentation |
| `chore/` | Config and tooling |

---

## Pull Request Requirements

- ✅ The build must pass with **no TypeScript errors** (`pnpm build`).
- ✅ Follow the existing architecture:
  - **Presentational** components live in `src/components/`.
  - **Data fetching and stateful logic** live in `src/hooks/` or `Dashboard.tsx`.
  - **Pure, framework-free logic** (contract calls, formatting, error mapping) lives in `src/lib/`.
- ✅ UI changes should work across both desktop and mobile widths.
- ✅ Keep PRs focused — one logical change per PR is easier to review and merge.

---

## Local Setup

```bash
git clone https://github.com/OpenStreamFi/paystream-app.git
cd paystream-app
pnpm install
pnpm dev
```

Then:

1. Install the [Freighter wallet](https://freighter.app) browser extension.
2. Switch Freighter to **Testnet** (Settings → Network → Testnet).
3. Fund your account with free testnet XLM via [Friendbot](https://friendbot.stellar.org).

You'll need a funded testnet account to test any wallet interaction (creating streams, withdrawing, etc.).

---

## Code Style

- This project uses **TypeScript**, **React 19**, and **Tailwind CSS v4**.
- Match the conventions of the surrounding code — naming, structure, and comment density.
- Comments should explain *non-obvious decisions*, not restate what the code already says.

---

## Questions?

Open a [GitHub Discussion](https://github.com/OpenStreamFi/paystream-app/discussions) or reach out through the OpenStreamFi community channels. We're happy to help you get started.
