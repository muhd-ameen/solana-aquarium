---
phase: idea
completed_at: 2026-04-29T22:50:00Z
---

# Idea Phase — Handoff

## Chosen Idea

- **slug:** `solana-aquarium`
- **name:** Solana Aquarium
- **one_liner:** A single shared on-chain aquarium where every user mints a fish (PDA with traits), feeds it, watches it age, and (stretch) breeds it. The frontend renders the entire community's fish swimming together in one tank.

## Why Crypto

Each fish is a permissionless, transferable, persistent on-chain object. The tank is shared infrastructure no platform controls — fish can outlive the frontend, get traded, render in any other UI that reads the program's accounts. Web2 fish tank → operator owns it. On-chain → wallet owns it forever.

## Scores (out of 3)

- founder_fit: 3
- mvp_speed: 2
- distribution_clarity: 2
- market_pull: 2
- learning_value: 3

## Stack

- **Program:** Anchor (~200 lines, 2–3 instructions)
- **Frontend:** Next.js + Tailwind + shadcn/ui
- **Canvas:** PixiJS (do NOT write raw canvas)
- **Wallet:** `@solana/wallet-adapter-react`
- **RPC:** Helius free tier on devnet

## Program Shape

```rust
// Fish PDA — fixed-size, no variable-length strings
seeds = [b"fish", owner.key(), nonce]
struct Fish {
  owner: Pubkey,
  species: u8,        // 0..N
  color: u8,          // 0..N
  speed: u8,          // 0..255
  size: u8,           // 0..255
  born_at: i64,       // Clock sysvar
  last_fed: i64,      // updated by feed()
}

instructions:
  mint_fish(nonce)        // pseudo-random traits via Clock + recent_blockhashes
  feed(fish_pda)          // updates last_fed
  breed(fish_a, fish_b)   // STRETCH: cooldown + mixed traits
```

## 5-Day Plan

- **Day 1** — Toolchain install, Anchor scaffold, `mint_fish` + traits randomization on localnet
- **Day 2** — `feed` + starvation/death logic + Anchor tests (mint, feed, starve, double-mint)
- **Day 3** — Next.js + PixiJS canvas; `program.account.fish.all()` → render every fish swimming
- **Day 4** — `breed` (stretch) + visual polish (bubbles, hover-to-see-owner, explorer links)
- **Day 5** — 90s demo (live mint), README, submit, launch tweet

## Competitors

- **Aquarium-style Web2 idle games** (substitute) — single operator, no ownership, no shared tank
- **EVM on-chain pet games (Pixels, Sanko)** (direct) — different chain; Solana niche is wide open
- **Generic Solana NFT mints** (substitute) — static art, no live state — yours has time-based behavior

## GTM

- **wedge:** Pick a charm theme — "Solana Reef" (coral biodiversity), "Pixel Pond" (8-bit retro), or "Genesis Aquarium" (Gen 0 only — Gen 1+ via breed)
- **first_ten_users:** Friends + 5 builders tagged in launch tweet — get them to mint before judging so the tank is ALIVE when judges open it
- **channels:** Twitter/X launch thread, Solana hackathon Discord (drop devnet URL — let people mint while you sleep), friend group chats
- **message_angle:** "A shared, permanent on-chain aquarium. Mint a fish — it lives in everyone else's tank too. Forever."

## Top Risks

1. Rust borrow-checker eats Day 1–2 → stay in Anchor, copy patterns from solana-developers/program-examples
2. Trait randomization → use Clock sysvar XOR recent slot hash (NOT Switchboard VRF — too much for 5d)
3. Canvas animation eats Day 3 → use PixiJS, find swimming-spritesheet tutorial Day 1 evening
4. Fish die during judging → tune decay slow (no starvation under 24h on devnet); demo on freshly-fed tank
5. Judges miss the "shared tank" magic → open with "this is the entire hackathon's fish, live, on-chain" + let a judge mint one

## Source Reports

- `idea-deep-dive-20260429-225000.html` (grayscale theme)

## Constraints Captured

- 5-day hackathon deadline
- Total Rust beginner
- Goal: learn Solana deeply via a project judges remember

## Next Phase

- `scaffold-project` — set up Anchor + Next.js + PixiJS workspace with this context
- `build-with-claude` — guided MVP implementation, day-by-day
