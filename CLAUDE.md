# Solana Aquarium — Project Context

This file is the source of truth for any AI agent working in this repo. Read it first.

## What this is

A single shared on-chain aquarium on Solana. Every user mints a "fish" (a PDA with traits — species, color, speed, size, born_at, last_fed). The frontend renders **every** minted fish swimming together in one shared tank using PixiJS. The on-chain program tracks fish state; the frontend is the live demo.

This is a **5-day hackathon project** built by a **total Rust beginner** whose primary goal is to learn Solana deeply through a project judges remember.

## Hard rules (do not violate)

1. **Always use Anchor**, never raw Solana programs. The user is a Rust beginner and Anchor's macros are the only sane on-ramp.
2. **Use PixiJS** for the canvas. Do NOT write raw `<canvas>` code or recommend Three.js / React Three Fiber for this 2D scene.
3. **Fixed-size traits only** in the Fish PDA. No variable-length strings — they cause `AccountDidNotDeserialize` errors that eat a beginner's day. Species/color are `u8` enums.
4. **Pseudo-random traits** via Solana `Clock` sysvar XOR'd with a recent slot hash. Do **not** integrate Switchboard VRF — too much for 5 days.
5. **Tune decay slow** — fish should not starve in under 24h on devnet, so a populated tank stays alive during judging.
6. **Use `getProgramAccounts` with discriminator memcmp filter**. Don't worry about scaling past 5k fish — won't happen in a hackathon.
7. **Stay on devnet** until Day 5. Don't deploy to mainnet during the hackathon (unless the user explicitly asks).
8. **Do not auto-commit, push, or deploy** without explicit user confirmation.

## Program shape (target — not yet written)

```rust
// File: anchor/programs/<program_name>/src/lib.rs
// PDA seeds: [b"fish", owner.key(), nonce.to_le_bytes()]

pub struct Fish {
    pub owner: Pubkey,
    pub species: u8,    // 0..N — pick 4–6 species for art
    pub color: u8,      // 0..N — palette index
    pub speed: u8,      // 0..255 — affects swim animation
    pub size: u8,       // 0..255 — visual scale
    pub born_at: i64,   // Clock.unix_timestamp at mint
    pub last_fed: i64,  // updated by feed()
    pub nonce: u8,      // allows multiple fish per owner
}

instructions:
  mint_fish(nonce: u8)        // pseudo-random traits via Clock + recent slot hash
  feed(fish_pda)              // updates last_fed; if (now - last_fed) > 24h: starving
  breed(fish_a, fish_b)       // STRETCH (Day 4): cooldown + mixed traits
```

> The scaffold currently contains a `counter` program as a placeholder. Day 1 of the build phase replaces it with the Aquarium program — either by renaming the directory or by adding a new `aquarium` program alongside.

## 5-day plan (binding)

| Day | Goal | Definition of done |
|-----|------|-------------------|
| 1 | Toolchain + Anchor + `mint_fish` on localnet | Can call `mint_fish` from a TS test, see the Fish PDA in the explorer |
| 2 | `feed` + starvation logic + Anchor tests | 4 tests pass: success, double-mint with different nonces, feed, starve transition |
| 3 | Next.js + PixiJS canvas reading from devnet | Tank renders every minted fish, swimming in real time |
| 4 | `breed` (stretch) + visual polish | Bubbles, hover-to-see-owner, explorer link, empty/error states |
| 5 | 90s demo recorded; README; submission posted | Submission live, launch tweet posted, demo plays cleanly |

## Stack

- **Program:** Anchor 0.32.1 + Solana 3.1.14 + Rust 1.95
- **Frontend:** Next.js (App Router) + Tailwind + shadcn/ui
- **Canvas:** PixiJS (`pixi.js`)
- **Wallet:** `@solana/wallet-adapter-react` (Wallet Standard — auto-detects Phantom/Solflare/Backpack)
- **RPC:** Helius free tier on devnet (set `NEXT_PUBLIC_HELIUS_API_KEY` in `.env.local`)
- **Tests:** Anchor's Jest setup (already wired)

## Working directory layout

```
aquarium/
  anchor/
    programs/
      counter/                 ← TODO: rename to `aquarium` in Day 1, or add a sibling dir
        src/lib.rs             ← scaffold counter (will be replaced by Fish program)
    tests/
    Anchor.toml                ← localnet program ID lives here
  src/                         ← Next.js
    app/                       ← App Router pages
    components/
      counter/                 ← scaffold counter UI (will be repurposed for tank UI)
      cluster/                 ← cluster (network) switcher — keep
      account/                 ← wallet account UI — keep
      solana/                  ← wallet provider — keep
      ui/                      ← shadcn/ui primitives — keep
    lib/                       ← anchor client helpers
  .superstack/
    idea-context.md            ← Phase 1 handoff
    build-context.md           ← Phase 2 handoff (this scaffold)
  CLAUDE.md                    ← this file
```

## Daily commands

```bash
# Anchor program
pnpm run anchor-build           # compile program → target/deploy/*.so
pnpm run anchor-test            # run Anchor tests against localnet
pnpm run anchor-localnet        # start a local validator

# Frontend
pnpm dev                        # Next.js dev server (turbopack)
pnpm build && pnpm start        # production build + serve

# Solana CLI
solana balance                  # check dev wallet balance
solana airdrop 2                # devnet faucet (rate limited — also use https://faucet.solana.com)
solana config get               # show current cluster + wallet
```

## Deployment to devnet (Day 4)

```bash
# 1. Build with the devnet feature
cd anchor
anchor build

# 2. Sync the program ID into Anchor.toml + lib.rs
anchor keys sync

# 3. Deploy to devnet (needs ~2 SOL on dev wallet)
anchor deploy --provider.cluster devnet

# 4. Lock the program ID — never change it again, frontend reads from it
```

## Helius RPC (recommended)

```bash
# 1. Get a free API key: https://www.helius.dev/
# 2. Add to .env.local:
echo 'NEXT_PUBLIC_HELIUS_API_KEY=your_key_here' >> .env.local
echo 'NEXT_PUBLIC_HELIUS_DEVNET_URL=https://devnet.helius-rpc.com/?api-key=your_key_here' >> .env.local
# 3. Wire into wallet provider — replace the public devnet RPC with Helius for ~10x reliability
```

## What NOT to add

- ❌ Switchboard / VRF — too complex for 5d
- ❌ Token-2022 metadata extension — not needed; traits live in the Fish PDA
- ❌ Compressed NFTs (Bubblegum) — wrong tradeoff for live time-based state
- ❌ Subgraph / external indexer — `getProgramAccounts` is enough for a hackathon
- ❌ Mainnet deployment — devnet only

## Known gotchas the user will hit

1. **`AccountDidNotDeserialize`** — almost always means account `space` was calculated wrong. Use `Fish::INIT_SPACE` + 8 (discriminator).
2. **`AccountInUse` / "instruction modified data of an account it does not own"** — usually wrong PDA seeds or missing `mut` on the account constraint.
3. **Anchor tests hang** — usually localnet validator isn't running; start with `pnpm run anchor-localnet` in a second terminal.
4. **PixiJS Canvas not appearing** — must be inside a `useEffect` hook; SSR will crash if Pixi tries to access `window` during build.

## Phase handoff

- **Read:** `.superstack/idea-context.md` (Phase 1 — idea selection)
- **Write:** `.superstack/build-context.md` (Phase 2 — scaffold decisions)
- **Next:** run `/build-with-claude` to begin Day 1 implementation.
