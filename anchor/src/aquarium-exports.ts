import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import AquariumIDLJson from '../target/idl/aquarium.json'
import type { Aquarium } from '../target/types/aquarium'

// Clone the IDL to avoid Turbopack frozen-module issues with JSON imports
const AquariumIDL = JSON.parse(JSON.stringify(AquariumIDLJson))

export { Aquarium }
export { AquariumIDL }

export const AQUARIUM_PROGRAM_ID = new PublicKey(AquariumIDL.address)

export function getAquariumProgram(provider: AnchorProvider, address?: PublicKey): Program<Aquarium> {
  const idl = { ...AquariumIDL }
  if (address) {
    idl.address = address.toBase58()
  }
  return new Program(idl as Aquarium, provider)
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
