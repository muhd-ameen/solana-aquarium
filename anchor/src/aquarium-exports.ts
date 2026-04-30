import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import AquariumIDL from '../target/idl/aquarium.json'
import type { Aquarium } from '../target/types/aquarium'

export { Aquarium, AquariumIDL }

export const AQUARIUM_PROGRAM_ID = new PublicKey(AquariumIDL.address)

export function getAquariumProgram(provider: AnchorProvider, address?: PublicKey): Program<Aquarium> {
  return new Program(
    { ...AquariumIDL, address: address ? address.toBase58() : AquariumIDL.address } as Aquarium,
    provider,
  )
}

export function getAquariumProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
    default:
      return AQUARIUM_PROGRAM_ID
  }
}
