---
phase: build
scaffolded_at: 2026-04-29T22:55:00Z
project: solana-aquarium
---

# Build Phase — Scaffold Handoff

## Stack (locked)

| Layer | Choice | Version |
|-------|--------|---------|
| Program framework | Anchor | 0.32.1 |
| Solana CLI | Agave (Anza) | 3.1.14 |
| Rust | stable | 1.95.0 |
| Local sim | Surfpool | 1.2.0 |
| Frontend | Next.js (App Router) | latest (via `web3js-next-tailwind-counter` template) |
| Wallet SDK | `@solana/wallet-adapter-react` (Wallet Standard) | template default |
| Solana JS | `@solana/web3.js` | 1.98.4 |
| Canvas | `pixi.js` | 8.18.1 |
| UI | Tailwind + shadcn/ui | template default |
| Package manager | pnpm | 10.33.2 |

## Architecture pattern

**Pattern 1: Next.js + Anchor dApp** (per `scaffold-project/references/architecture-patterns.md`)

```
aquarium/
  anchor/
    Anchor.toml
    programs/
      counter/                 ← TODO Day 1: rename to `aquarium` or add sibling
        src/lib.rs             ← scaffold placeholder, replace with Fish program
    tests/                     ← Jest + ts-jest preset
    target/                    ← compiled artifacts (gitignored)
  src/
    app/                       ← Next.js App Router
    components/
      counter/                 ← repurpose for tank UI
      solana/                  ← wallet provider — keep
      cluster/                 ← cluster switcher — keep
      ui/                      ← shadcn primitives — keep
    lib/                       ← anchor client helpers
  .superstack/
    idea-context.md            ← from Phase 1
    build-context.md           ← this file
  .claude/
    settings.local.json        ← permission allowlist for fewer prompts
    skills/                    ← solana-dev skill (auto-installed by installer)
  CLAUDE.md                    ← project context for AI
  .env.local.example           ← Helius RPC placeholder
  package.json
  Anchor.toml
```

## Skills installed

- **`solana-dev`** (Solana Foundation, official) — auto-installed at `~/.agents/skills/solana-dev` by the Solana installer; symlinked into `aquarium/skills/`. Provides Anchor patterns, common errors, and Solana-specific code review.

## MCPs configured

- *None yet.* Helius MCP is recommended but requires a free API key from https://www.helius.dev/. To add later, install per Helius MCP server docs and reference `NEXT_PUBLIC_HELIUS_API_KEY` from `.env.local`.

## Solana environment

- **Cluster:** devnet (set in `~/.config/solana/cli/config.yml`)
- **Dev wallet:** `FXZSvja9xjCWdcRkPGyN4fyVTezi4tjFQZdMpEwgYEnV` at `~/.config/solana/id.json`
- **Wallet balance:** 0 SOL (airdrop rate-limited; use https://faucet.solana.com for top-up)
- **Default cluster RPC:** `https://api.devnet.solana.com` (replace with Helius once key is added)

## Build status

```yaml
mvp_complete: true
tests_passing: true
devnet_deployed: true
program_renamed_to_aquarium: true
fish_program_implemented: true
canvas_renders_fish: true
breed_implemented: true
program_id: "Hb9mNuHBMNapZ6aewU6a3HKNnJ2nYhMxrhZHM43YKNTo"
milestones:
  - "anchor build + generate IDL + sync keys"
  - "Add feed instruction to program"
  - "Write Anchor tests (6/6 passing: mint, dup-nonce, reject-dup, feed, breed, fetch-all)"
  - "Wire frontend — aquarium exports, tank components, routing"
  - "PixiJS canvas with animated bubbles, seabed, light rays, 8 species shapes"
  - "Breed instruction — mix parent traits, starvation gate, deployed to devnet"
  - "Visual polish — stats bar, owner tags, color dots, time-since-fed, hover tooltips"
```

## What's done in this scaffold

- [x] Solana CLI 3.1.14 + Anchor 0.32.1 + Surfpool installed and on PATH
- [x] PATH persisted in `~/.zshrc`
- [x] Devnet set as default cluster
- [x] Dev wallet generated
- [x] Project scaffolded with `web3js-next-tailwind-counter` template
- [x] PixiJS 8.18.1 added to frontend deps
- [x] `CLAUDE.md` written with full project context, hard rules, and 5-day plan
- [x] `.claude/settings.local.json` allowlist for common dev commands
- [x] `.env.local.example` placeholder for Helius
- [x] `.superstack/idea-context.md` copied from parent dir

## What Day 1–2 of build accomplished

- [x] Rename `programs/counter/` → `programs/aquarium/` (Cargo.toml, lib.rs, Anchor.toml)
- [x] Replace counter logic with `Fish` PDA + `mint_fish` instruction
- [x] Add `feed` instruction with owner check (`has_one`)
- [x] Update Anchor tests — 5 tests passing (mint, double-mint-diff-nonce, reject-dup, feed, fetch-all)
- [x] Update `src/components/counter/*` → `src/components/tank/*`
- [x] Wire aquarium exports in `anchor/src/aquarium-exports.ts`
- [x] PixiJS canvas renders all fish (species shapes, color palette, swimming animation, hover labels)
- [x] `anchor build` succeeds
- [x] `pnpm build` succeeds
- [x] Routes: `/` (landing), `/tank` (aquarium), `/account` (wallet)

## Known constraints carried from idea phase

- Total Rust beginner — keep program ≤ 200 lines
- 5-day deadline — drop scope before missing the demo
- Goal is *learning*, not winning a track — but the demo polish should still be hackathon-grade

## Next phase

Run `/build-with-claude` from the `aquarium/` directory. It will read this file plus `idea-context.md` and walk you through Day 1.

```bash
cd aquarium
# Then in Claude Code:
/build-with-claude
```
