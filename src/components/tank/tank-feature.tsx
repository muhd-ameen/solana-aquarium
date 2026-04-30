'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { useAquariumProgram } from './tank-data-access'
import { TankCanvas, TankStats, MintButton, BreedPanel, FishList } from './tank-ui'
import { ExplorerLink } from '../cluster/cluster-ui'
import { ellipsify } from '@/lib/utils'

export default function TankFeature() {
  const { publicKey } = useWallet()
  const { programId } = useAquariumProgram()
  const [spotlightKey, setSpotlightKey] = useState<string | null>(null)

  if (!publicKey) {
    return (
      <div className="max-w-lg mx-auto text-center py-32 space-y-8">
        <div className="space-y-3">
          <div className="text-6xl">🐠</div>
          <h1 className="text-4xl font-bold tracking-tight">Solana Aquarium</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A shared on-chain fish tank. Connect your wallet to mint a fish and watch it swim alongside everyone
            else&apos;s.
          </p>
        </div>
        <WalletButton />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">The Tank</h1>
          <p className="text-sm text-muted-foreground">
            Every fish lives on-chain.{' '}
            <ExplorerLink
              path={`account/${programId}`}
              label={ellipsify(programId.toString())}
              className="text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border"
            />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MintButton />
        </div>
      </div>

      <TankCanvas spotlightKey={spotlightKey} />
      <TankStats />
      <BreedPanel />
      <FishList spotlightKey={spotlightKey} onSpotlight={setSpotlightKey} />
    </div>
  )
}
