import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { Aquarium } from '../target/types/aquarium'

describe('aquarium', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Aquarium as Program<Aquarium>

  function fishPDA(owner: PublicKey, nonce: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('fish'), owner.toBuffer(), Buffer.from([nonce])],
      program.programId,
    )
  }

  it('mints a fish with nonce 0', async () => {
    const nonce = 0
    const [fishKey] = fishPDA(payer.publicKey, nonce)

    await program.methods
      .mintFish(nonce)
      .accounts({
        owner: payer.publicKey,
        fish: fishKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    const fish = await program.account.fish.fetch(fishKey)

    expect(fish.owner.toBase58()).toEqual(payer.publicKey.toBase58())
    expect(fish.nonce).toEqual(nonce)
    expect(fish.species).toBeLessThanOrEqual(7)
    expect(fish.color).toBeLessThanOrEqual(7)
    expect(fish.bornAt.toNumber()).toBeGreaterThan(0)
    expect(fish.lastFed.toNumber()).toEqual(fish.bornAt.toNumber())
  })

  it('mints a second fish with nonce 1 (same owner)', async () => {
    const nonce = 1
    const [fishKey] = fishPDA(payer.publicKey, nonce)

    await program.methods
      .mintFish(nonce)
      .accounts({
        owner: payer.publicKey,
        fish: fishKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    const fish = await program.account.fish.fetch(fishKey)
    expect(fish.owner.toBase58()).toEqual(payer.publicKey.toBase58())
    expect(fish.nonce).toEqual(1)
  })

  it('rejects duplicate mint (same owner + nonce)', async () => {
    const nonce = 0
    const [fishKey] = fishPDA(payer.publicKey, nonce)

    await expect(
      program.methods
        .mintFish(nonce)
        .accounts({
          owner: payer.publicKey,
          fish: fishKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc(),
    ).rejects.toThrow()
  })

  it('feeds a fish (updates last_fed)', async () => {
    const nonce = 0
    const [fishKey] = fishPDA(payer.publicKey, nonce)

    const before = await program.account.fish.fetch(fishKey)

    await new Promise((r) => setTimeout(r, 1500))

    await program.methods
      .feed()
      .accounts({ owner: payer.publicKey, fish: fishKey })
      .rpc()

    const after = await program.account.fish.fetch(fishKey)
    expect(after.lastFed.toNumber()).toBeGreaterThanOrEqual(before.lastFed.toNumber())
  })

  it('breeds two fish into a child', async () => {
    const [parentA] = fishPDA(payer.publicKey, 0)
    const [parentB] = fishPDA(payer.publicKey, 1)
    const childNonce = 2
    const [childKey] = fishPDA(payer.publicKey, childNonce)

    await program.methods
      .breed(childNonce)
      .accounts({
        owner: payer.publicKey,
        parentA,
        parentB,
        child: childKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    const child = await program.account.fish.fetch(childKey)
    expect(child.owner.toBase58()).toEqual(payer.publicKey.toBase58())
    expect(child.nonce).toEqual(childNonce)
    expect(child.bornAt.toNumber()).toBeGreaterThan(0)
  })

  it('fetches all fish with getProgramAccounts', async () => {
    const allFish = await program.account.fish.all()
    expect(allFish.length).toBeGreaterThanOrEqual(3)

    for (const f of allFish) {
      expect(f.account.owner.toBase58()).toEqual(payer.publicKey.toBase58())
    }
  })
})
