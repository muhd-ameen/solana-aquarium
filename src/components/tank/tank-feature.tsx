'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { useAquariumProgram } from './tank-data-access'
import { TankCanvas, TankStats, MintButton, BreedPanel, FishList } from './tank-ui'
import { ExplorerLink } from '../cluster/cluster-ui'
import { ellipsify } from '@/lib/utils'

export default function TankFeature() {
  const { publicKey } = useWallet()
  const { programId } = useAquariumProgram()

  return publicKey ? (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center space-y-3 pt-2">
        <h1 className="text-3xl font-bold tracking-tight">Solana Aquarium</h1>
        <p className="text-muted-foreground">
          A shared on-chain fish tank. Mint a fish — it lives in everyone&apos;s tank.
        </p>
        <div className="flex items-center justify-center gap-3">
          <MintButton />
          <ExplorerLink
            path={`account/${programId}`}
            label={ellipsify(programId.toString())}
            className="text-xs text-muted-foreground hover:text-foreground"
          />
        </div>
        <BreedPanel />
      </div>
      <TankCanvas />
      <TankStats />
      <FishList />
    </div>
  ) : (
    <div className="max-w-lg mx-auto text-center py-24 space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Solana Aquarium</h1>
      <p className="text-muted-foreground text-lg">
        Connect your wallet to see the shared tank and mint your fish.
      </p>
      <WalletButton />
    </div>
  )
}
