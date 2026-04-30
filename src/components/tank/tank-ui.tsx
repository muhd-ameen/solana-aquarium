'use client'

import { PublicKey } from '@solana/web3.js'
import { useMemo, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAquariumProgram, useFishAccount } from './tank-data-access'
import { ellipsify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ExplorerLink } from '../cluster/cluster-ui'
import type { FishData } from './aquarium-canvas'

const AquariumCanvas = dynamic(() => import('./aquarium-canvas').then((m) => m.AquariumCanvas), { ssr: false })

const SPECIES_NAMES = ['Clownfish', 'Pufferfish', 'Angelfish', 'Swordtail', 'Tetra', 'Guppy', 'Betta', 'Goldfish']
const COLOR_NAMES = ['Coral', 'Ocean', 'Sunset', 'Emerald', 'Violet', 'Gold', 'Silver', 'Crimson']
const COLOR_HEX = ['#f87171', '#60a5fa', '#fb923c', '#34d399', '#a78bfa', '#fbbf24', '#cbd5e1', '#e11d48']

const STARVATION_THRESHOLD = 24 * 60 * 60
const DEATH_THRESHOLD = 172_800

function fishStatus(lastFedUnix: number, growth: number): 'happy' | 'hungry' | 'starving' | 'dead' {
  const elapsed = Date.now() / 1000 - lastFedUnix
  if (growth >= 255 && elapsed >= DEATH_THRESHOLD) return 'dead'
  if (elapsed < STARVATION_THRESHOLD * 0.5) return 'happy'
  if (elapsed < STARVATION_THRESHOLD) return 'hungry'
  return 'starving'
}

function growthLabel(growth: number): string {
  if (growth >= 255) return 'Fully Grown'
  if (growth >= 190) return 'Mature'
  if (growth >= 125) return 'Adult'
  if (growth >= 50) return 'Young'
  return 'Baby'
}

function timeSince(unix: number): string {
  const secs = Math.floor(Date.now() / 1000 - unix)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export function MintButton() {
  const { mintFish, myFishCount } = useAquariumProgram()

  return (
    <Button onClick={() => mintFish.mutateAsync()} disabled={mintFish.isPending} className="gap-1.5">
      {mintFish.isPending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Minting...
        </>
      ) : (
        <>Mint Fish #{myFishCount}</>
      )}
    </Button>
  )
}

export function BreedPanel() {
  const { myFish, breedFish, myFishCount } = useAquariumProgram()
  const [parentA, setParentA] = useState<string>('')
  const [parentB, setParentB] = useState<string>('')

  if (myFishCount < 2) return null

  const canBreed = parentA && parentB && parentA !== parentB

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium">Breed</span>
        <span className="text-xs text-muted-foreground">Combine two of your fish</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={parentA}
          onChange={(e) => setParentA(e.target.value)}
          className="h-9 flex-1 min-w-[140px] rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="">Parent A</option>
          {myFish.map((f) => (
            <option key={f.publicKey.toBase58()} value={f.publicKey.toBase58()}>
              {SPECIES_NAMES[f.account.species]} #{f.account.nonce}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground text-lg">+</span>
        <select
          value={parentB}
          onChange={(e) => setParentB(e.target.value)}
          className="h-9 flex-1 min-w-[140px] rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="">Parent B</option>
          {myFish
            .filter((f) => f.publicKey.toBase58() !== parentA)
            .map((f) => (
              <option key={f.publicKey.toBase58()} value={f.publicKey.toBase58()}>
                {SPECIES_NAMES[f.account.species]} #{f.account.nonce}
              </option>
            ))}
        </select>
        <Button
          variant="secondary"
          disabled={!canBreed || breedFish.isPending}
          className="gap-1"
          onClick={() => {
            if (!canBreed) return
            breedFish.mutateAsync({
              parentAKey: new PublicKey(parentA),
              parentBKey: new PublicKey(parentB),
            })
          }}
        >
          {breedFish.isPending ? 'Breeding...' : 'Breed'}
        </Button>
      </div>
    </div>
  )
}

export function TankCanvas({ spotlightKey }: { spotlightKey?: string | null }) {
  const { allFish } = useAquariumProgram()

  const fishData: FishData[] = useMemo(() => {
    if (!allFish.data) return []
    return allFish.data.map((f) => ({
      key: f.publicKey.toBase58(),
      owner: f.account.owner.toBase58(),
      species: f.account.species,
      color: f.account.color,
      speed: f.account.speed,
      size: f.account.size,
      nonce: f.account.nonce,
      lastFed: f.account.lastFed.toNumber(),
      growth: f.account.growth ?? 0,
    }))
  }, [allFish.data])

  if (allFish.isLoading) {
    return (
      <div className="w-full rounded-2xl border border-border/40 bg-gradient-to-b from-[#0c1929] via-[#0f2744] to-[#0a1628] min-h-[420px] flex items-center justify-center shadow-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400/40 border-t-blue-400" />
          <p className="text-blue-300/60 text-sm">Loading tank...</p>
        </div>
      </div>
    )
  }

  if (fishData.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-border/40 bg-gradient-to-b from-[#0c1929] via-[#0f2744] to-[#0a1628] min-h-[420px] flex items-center justify-center shadow-xl">
        <div className="space-y-3 text-center">
          <div className="text-5xl opacity-60">🐠</div>
          <p className="text-lg font-medium text-blue-200/80">The tank is empty</p>
          <p className="text-sm text-blue-300/50">Mint the first fish to bring it to life</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="rounded-2xl overflow-hidden border border-border/40 shadow-xl">
        <AquariumCanvas fishList={fishData} spotlightKey={spotlightKey} />
      </div>
      <p className="text-xs text-center text-muted-foreground">
        {fishData.length} fish swimming &middot; hover to inspect &middot; click a card below to spotlight
      </p>
    </div>
  )
}

export function TankStats() {
  const { allFish, myFishCount } = useAquariumProgram()
  const { publicKey } = useWallet()
  const total = allFish.data?.length ?? 0
  const owners = useMemo(() => {
    if (!allFish.data) return 0
    return new Set(allFish.data.map((f) => f.account.owner.toBase58())).size
  }, [allFish.data])

  if (!publicKey || total === 0) return null

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Total Fish" value={total} />
      <StatCard label="Owners" value={owners} />
      <StatCard label="Yours" value={myFishCount} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}

export function FishList({
  spotlightKey,
  onSpotlight,
}: {
  spotlightKey?: string | null
  onSpotlight?: (key: string | null) => void
}) {
  const { allFish, getProgramAccount } = useAquariumProgram()

  if (getProgramAccount.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="text-center p-8 rounded-xl border border-border/60 bg-card">
        <p className="text-muted-foreground">Program not found on this cluster. Switch to devnet.</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Fish</h2>
        {spotlightKey && (
          <button
            onClick={() => onSpotlight?.(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear spotlight
          </button>
        )}
      </div>
      {allFish.isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : allFish.data?.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allFish.data.map((fish) => (
            <FishCard
              key={fish.publicKey.toString()}
              fishKey={fish.publicKey}
              isSpotlit={spotlightKey === fish.publicKey.toBase58()}
              onSpotlight={onSpotlight}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-xl border border-border/60 bg-card">
          <p className="text-muted-foreground">No fish yet. Be the first to mint one!</p>
        </div>
      )}
    </div>
  )
}

function FishCard({
  fishKey,
  isSpotlit,
  onSpotlight,
}: {
  fishKey: PublicKey
  isSpotlit?: boolean
  onSpotlight?: (key: string | null) => void
}) {
  const { fishQuery, feedMutation } = useFishAccount({ fishKey })
  const { publicKey } = useWallet()
  const { transferFish } = useAquariumProgram()
  const [showTransfer, setShowTransfer] = useState(false)
  const [recipient, setRecipient] = useState('')
  const recipientRef = useRef<HTMLInputElement>(null)

  if (fishQuery.isLoading) {
    return <div className="animate-pulse h-[200px] bg-muted/50 rounded-xl" />
  }

  const fish = fishQuery.data
  if (!fish) return null

  const growth = fish.growth ?? 0
  const status = fishStatus(fish.lastFed.toNumber(), growth)
  const isDead = status === 'dead'
  const statusDot =
    status === 'happy'
      ? 'bg-emerald-500'
      : status === 'hungry'
        ? 'bg-amber-500'
        : status === 'dead'
          ? 'bg-neutral-500'
          : 'bg-red-500'
  const statusText = status === 'happy' ? 'Happy' : status === 'hungry' ? 'Hungry' : status === 'dead' ? 'Dead' : 'Starving'
  const isOwner = publicKey?.toBase58() === fish.owner.toBase58()
  const colorHex = COLOR_HEX[fish.color % COLOR_HEX.length]
  const growthPct = Math.min(100, (growth / 255) * 100)

  function handleTransfer() {
    try {
      const dest = new PublicKey(recipient.trim())
      transferFish.mutateAsync({ fishKey, newOwner: dest }).then(() => {
        setShowTransfer(false)
        setRecipient('')
      })
    } catch {
      // invalid pubkey
    }
  }

  return (
    <div
      onClick={() => onSpotlight?.(isSpotlit ? null : fishKey.toBase58())}
      className={`rounded-xl border bg-card p-4 transition-all cursor-pointer ${
        isSpotlit
          ? 'border-primary ring-2 ring-primary/20 shadow-lg'
          : isDead
            ? 'border-border/40 opacity-60'
            : isOwner
              ? 'border-primary/30 shadow-sm hover:shadow-md'
              : 'border-border/60 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full ring-2 ring-background"
            style={{ backgroundColor: isDead ? '#737373' : colorHex }}
          />
          <span className={`font-medium text-sm ${isDead ? 'line-through text-muted-foreground' : ''}`}>
            {SPECIES_NAMES[fish.species] ?? 'Unknown'}
          </span>
          {isOwner && (
            <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">yours</span>
          )}
          {isDead && (
            <span className="text-[10px] font-medium bg-neutral-500/10 text-neutral-500 px-1.5 py-0.5 rounded-full">
              dead
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-muted-foreground">#{fish.nonce}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-3">
        <span className="text-muted-foreground">Color</span>
        <span>{COLOR_NAMES[fish.color] ?? 'Unknown'}</span>
        <span className="text-muted-foreground">Speed / Size</span>
        <span className="tabular-nums">
          {fish.speed} / {fish.size}
        </span>
        <span className="text-muted-foreground">Status</span>
        <span className="flex items-center gap-1.5">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot}`} />
          {statusText}
        </span>
        <span className="text-muted-foreground">Fed</span>
        <span>{timeSince(fish.lastFed.toNumber())}</span>
        <span className="text-muted-foreground">Growth</span>
        <span>{growthLabel(growth)}</span>
        <span className="text-muted-foreground">Owner</span>
        <ExplorerLink path={`account/${fish.owner}`} label={ellipsify(fish.owner.toBase58())} />
      </div>

      {/* Growth bar */}
      <div className="mb-3">
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              growth >= 255 ? 'bg-amber-500' : 'bg-primary'
            }`}
            style={{ width: `${growthPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{growth}/255</span>
          {growth >= 255 && !isDead && (
            <span className="text-[10px] text-amber-500">Fully grown — dies in 2d without food</span>
          )}
        </div>
      </div>

      {isOwner && !isDead && (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <Button
              variant={growth >= 255 ? 'destructive' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => feedMutation.mutateAsync()}
              disabled={feedMutation.isPending}
            >
              {feedMutation.isPending ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1.5" />
                  Feeding...
                </>
              ) : growth >= 255 ? (
                'Feed (Lethal!)'
              ) : (
                'Feed'
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowTransfer(!showTransfer)
                setTimeout(() => recipientRef.current?.focus(), 50)
              }}
            >
              Transfer
            </Button>
          </div>

          {showTransfer && (
            <div className="flex gap-1.5">
              <input
                ref={recipientRef}
                placeholder="Recipient wallet address..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="flex-1 h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring/30"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                size="sm"
                variant="secondary"
                className="h-8 text-xs"
                disabled={!recipient.trim() || transferFish.isPending}
                onClick={handleTransfer}
              >
                {transferFish.isPending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
