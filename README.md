# 🐟 Solana Aquarium

A shared on-chain aquarium on Solana. Mint a fish, watch it swim alongside everyone else's in real time.

Every fish is a PDA with pseudo-random traits (species, color, speed, size) generated at mint time. The PixiJS canvas renders all minted fish in one shared tank — no two aquariums look the same.

**Live on Solana Devnet.**

## How It Works

1. Connect your wallet (Phantom, Solflare, Backpack, etc.)
2. **Mint** a fish — traits are randomly assigned on-chain
3. **Feed** your fish to keep it alive (starves after 24h without food)
4. **Breed** two of your fish to create offspring with mixed traits
5. Watch the tank — every fish from every player swims together

## Stack

| Layer | Tech |
|-------|------|
| Program | Anchor (Rust) on Solana |
| Frontend | Next.js 16 (App Router) + Tailwind + shadcn/ui |
| Canvas | PixiJS |
| Wallet | `@solana/wallet-adapter-react` (Wallet Standard) |
| RPC | Helius devnet (free tier) |

## On-Chain Program

The Anchor program stores each fish as a PDA seeded by `[b"fish", owner, nonce]`.

**Instructions:**

- `mint_fish(nonce)` — creates a new fish with pseudo-random traits via `Clock` sysvar
- `feed(fish)` — resets the starvation timer; also increments growth (+25 per feed, caps at 255)
- `breed(parent_a, parent_b, child_nonce)` — combines two parents' traits into a child (both parents must be fed)
- `transfer_fish(fish, new_owner)` — transfers ownership

**Fish account:**

```
owner: Pubkey, species: u8, color: u8, speed: u8, size: u8,
born_at: i64, last_fed: i64, nonce: u8, bump: u8, growth: u8
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/)
- [Rust](https://rustup.rs/) + [Solana CLI](https://docs.solanalabs.com/cli/install) + [Anchor CLI](https://www.anchor-lang.com/docs/installation)

### Install

```bash
pnpm install
```

### Set up environment

```bash
cp .env.local.example .env.local
```

Get a free Helius API key at [helius.dev](https://www.helius.dev/) and fill in `.env.local`. Without it, the app falls back to the public devnet RPC (slower, rate-limited).

### Run the program locally

```bash
# Build the Anchor program
pnpm anchor-build

# Start a local validator with the program deployed
pnpm anchor-localnet

# Run tests (in a separate terminal)
pnpm anchor-test
```

### Run the frontend

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Devnet

```bash
cd anchor
anchor build
anchor keys sync
anchor deploy --provider.cluster devnet
```

Requires ~2 SOL in your dev wallet. Get devnet SOL from [faucet.solana.com](https://faucet.solana.com).

## Project Structure

```
aquarium/
├── anchor/
│   ├── programs/aquarium/src/lib.rs   # Solana program (Anchor/Rust)
│   ├── tests/                         # Anchor integration tests
│   └── Anchor.toml                    # Program config + IDs
├── src/
│   ├── app/                           # Next.js App Router pages
│   └── components/
│       ├── tank/                      # Aquarium canvas + UI
│       ├── cluster/                   # Network switcher
│       ├── account/                   # Wallet account UI
│       └── solana/                    # Wallet provider setup
├── .env.local.example                 # Environment template
└── package.json
```

## License

MIT
