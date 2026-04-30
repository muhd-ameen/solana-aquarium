'use client'

import { PublicKey } from '@solana/web3.js'
import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAquariumProgram, useFishAccount } from './tank-data-access'
import { ellipsify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ExplorerLink } from '../cluster/cluster-ui'
import type { FishData } from './aquarium-canvas'

const AquariumCanvas = dynamic(() => import('./aquarium-canvas').then((m) => m.AquariumCanvas), { ssr: false })

const SPECIES_NAMES = ['Clownfish', 'Pufferfish', 'Angelfish', 'Swordtail', 'Tetra', 'Guppy', 'Betta', 'Goldfish']
const COLOR_NAMES = ['Coral', 'Ocean', 'Sunset', 'Emerald', 'Violet', 'Gold', 'Silver', 'Crimson']
const COLOR_DOT = ['bg-red-400', 'bg-blue-400', 'bg-orange-400', 'bg-emerald-400', 'bg-violet-400', 'bg-yellow-400', 'bg-gray-300', 'bg-rose-600']

const STARVATION_THRESHOLD = 24 * 60 * 60

function fishStatus(lastFedUnix: number): 'happy' | 'hungry' | 'starving' {
  const elapsed = Date.now() / 1000 - lastFedUnix
  if (elapsed < STARVATION_THRESHOLD * 0.5) return 'happy'
  if (elapsed < STARVATION_THRESHOLD) return 'hungry'
  return 'starving'
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
    <Button onClick={() => mintFish.mutateAsync()} disabled={mintFish.isPending} size="lg">
      {mintFish.isPending ? 'Minting...' : `Mint Fish #${myFishCount}`}
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
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <select
        value={parentA}
        onChange={(e) => setParentA(e.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">Parent A</option>
        {myFish.map((f) => (
          <option key={f.publicKey.toBase58()} value={f.publicKey.toBase58()}>
            {SPECIES_NAMES[f.account.species]} #{f.account.nonce}
          </option>
        ))}
      </select>
      <span className="text-muted-foreground">+</span>
      <select
        value={parentB}
        onChange={(e) => setParentB(e.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-sm"
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
        size="sm"
        variant="secondary"
        disabled={!canBreed || breedFish.isPending}
        onClick={() => {
          if (!canBreed) return
          breedFish.mutateAsync({
            parentAKey: new PublicKey(parentA),
            parentBKey: new PublicKey(parentB),
          })
        }}
      >
        {breedFish.isPending ? 'Breeding...' : 'Breed 🧬'}
      </Button>
    </div>
  )
}

export function TankCanvas() {
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
    }))
  }, [allFish.data])

  if (allFish.isLoading) {
    return (
      <div className="w-full rounded-xl border-2 border-blue-300/30 bg-gradient-to-b from-sky-200 via-blue-300 to-blue-500 dark:from-sky-950 dark:via-blue-900 dark:to-blue-950 min-h-[400px] flex items-center justify-center">
        <p className="text-blue-800/60 dark:text-blue-200/60 animate-pulse">Loading tank...</p>
      </div>
    )
  }

  if (fishData.length === 0) {
    return (
      <div className="w-full rounded-xl border-2 border-blue-300/30 bg-gradient-to-b from-sky-200 via-blue-300 to-blue-500 dark:from-sky-950 dark:via-blue-900 dark:to-blue-950 p-8 text-center min-h-[400px] flex items-center justify-center">
        <div className="space-y-3">
          <p className="text-5xl">🐠</p>
          <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">The tank is empty</p>
          <p className="text-sm text-blue-700/70 dark:text-blue-300/70">Mint the first fish to bring it to life!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <AquariumCanvas fishList={fishData} />
      <p className="text-xs text-center text-muted-foreground">
        {fishData.length} fish swimming &middot; hover to inspect
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
    <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
      <span>{total} total fish</span>
      <span className="text-border">|</span>
      <span>{owners} owner{owners !== 1 ? 's' : ''}</span>
      <span className="text-border">|</span>
      <span>{myFishCount} yours</span>
    </div>
  )
}

export function FishList() {
  const { allFish, getProgramAccount } = useAquariumProgram()

  if (getProgramAccount.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    )
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <p className="text-muted-foreground">Program not found on this cluster. Switch to devnet.</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">All Fish</h2>
      {allFish.isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      ) : allFish.data?.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allFish.data.map((fish) => (
            <FishCard key={fish.publicKey.toString()} fishKey={fish.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No fish yet. Be the first to mint one!</p>
        </div>
      )}
    </div>
  )
}

function FishCard({ fishKey }: { fishKey: PublicKey }) {
  const { fishQuery, feedMutation } = useFishAccount({ fishKey })
  const { publicKey } = useWallet()

  if (fishQuery.isLoading) return <div className="animate-pulse h-44 bg-muted rounded-lg" />

  const fish = fishQuery.data
  if (!fish) return null

  const status = fishStatus(fish.lastFed.toNumber())
  const statusLabel = status === 'happy' ? 'Happy 😊' : status === 'hungry' ? 'Hungry 😐' : 'Starving 💀'
  const statusColor = status === 'happy' ? 'text-emerald-600' : status === 'hungry' ? 'text-amber-500' : 'text-red-500'
  const isOwner = publicKey?.toBase58() === fish.owner.toBase58()
  const colorDot = COLOR_DOT[fish.color % COLOR_DOT.length]

  return (
    <Card className={isOwner ? 'ring-1 ring-primary/30' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${colorDot}`} />
            {SPECIES_NAMES[fish.species] ?? 'Unknown'}
            {isOwner && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">yours</span>}
          </span>
          <span className="text-xs font-mono text-muted-foreground">#{fish.nonce}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">Color</span>
          <span>{COLOR_NAMES[fish.color] ?? 'Unknown'}</span>
          <span className="text-muted-foreground">Speed / Size</span>
          <span>{fish.speed} / {fish.size}</span>
          <span className="text-muted-foreground">Status</span>
          <span className={statusColor}>{statusLabel}</span>
          <span className="text-muted-foreground">Fed</span>
          <span>{timeSince(fish.lastFed.toNumber())}</span>
          <span className="text-muted-foreground">Owner</span>
          <ExplorerLink path={`account/${fish.owner}`} label={ellipsify(fish.owner.toBase58())} />
        </div>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => feedMutation.mutateAsync()}
            disabled={feedMutation.isPending}
          >
            {feedMutation.isPending ? 'Feeding...' : 'Feed 🍕'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
