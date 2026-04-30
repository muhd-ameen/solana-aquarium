'use client'

import { getAquariumProgram, getAquariumProgramId } from '@project/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'

export function useAquariumProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const { publicKey } = useWallet()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getAquariumProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getAquariumProgram(provider, programId), [provider, programId])

  const allFish = useQuery({
    queryKey: ['aquarium', 'all-fish', { cluster }],
    queryFn: () => program.account.fish.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const myFishCount = useMemo(() => {
    if (!allFish.data || !publicKey) return 0
    return allFish.data.filter((f) => f.account.owner.toBase58() === publicKey.toBase58()).length
  }, [allFish.data, publicKey])

  const mintFish = useMutation({
    mutationKey: ['aquarium', 'mint-fish', { cluster }],
    mutationFn: async () => {
      if (!publicKey) throw new Error('Wallet not connected')
      const nonce = myFishCount
      const [fishPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('fish'), publicKey.toBuffer(), Buffer.from([nonce])],
        programId,
      )
      return program.methods
        .mintFish(nonce)
        .accounts({
          owner: publicKey,
          fish: fishPDA,
        })
        .rpc({ skipPreflight: true, commitment: 'confirmed' })
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      allFish.refetch()
    },
    onError: (error) => {
      const msg = `${error}`
      if (msg.includes('already been processed')) {
        toast.success('Fish minted!')
        allFish.refetch()
        return
      }
      toast.error('Failed to mint fish', { description: msg })
    },
  })

  const myFish = useMemo(() => {
    if (!allFish.data || !publicKey) return []
    return allFish.data.filter((f) => f.account.owner.toBase58() === publicKey.toBase58())
  }, [allFish.data, publicKey])

  const breedFish = useMutation({
    mutationKey: ['aquarium', 'breed', { cluster }],
    mutationFn: async ({ parentAKey, parentBKey }: { parentAKey: PublicKey; parentBKey: PublicKey }) => {
      if (!publicKey) throw new Error('Wallet not connected')
      const childNonce = myFishCount
      const [childPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('fish'), publicKey.toBuffer(), Buffer.from([childNonce])],
        programId,
      )
      return program.methods
        .breed(childNonce)
        .accounts({
          parentA: parentAKey,
          parentB: parentBKey,
          child: childPDA,
        })
        .rpc({ skipPreflight: true, commitment: 'confirmed' })
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      allFish.refetch()
    },
    onError: (error) => {
      const msg = `${error}`
      if (msg.includes('already been processed')) {
        toast.success('Fish bred!')
        allFish.refetch()
        return
      }
      if (msg.includes('ParentStarving')) {
        toast.error('Feed both parents first — they must be fed within 24h to breed')
        return
      }
      toast.error('Failed to breed', { description: msg })
    },
  })

  return {
    program,
    programId,
    allFish,
    getProgramAccount,
    mintFish,
    breedFish,
    myFishCount,
    myFish,
  }
}

export function useFishAccount({ fishKey }: { fishKey: PublicKey }) {
  const { cluster } = useCluster()
  const { publicKey } = useWallet()
  const transactionToast = useTransactionToast()
  const { program, programId, allFish } = useAquariumProgram()

  const fishQuery = useQuery({
    queryKey: ['aquarium', 'fish', { cluster, fishKey: fishKey.toBase58() }],
    queryFn: () => program.account.fish.fetch(fishKey),
  })

  const feedMutation = useMutation({
    mutationKey: ['aquarium', 'feed', { cluster, fishKey: fishKey.toBase58() }],
    mutationFn: async () => {
      if (!publicKey) throw new Error('Wallet not connected')
      return program.methods.feed().accounts({ fish: fishKey }).rpc({ skipPreflight: true, commitment: 'confirmed' })
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      fishQuery.refetch()
      allFish.refetch()
    },
    onError: (error) => {
      const msg = `${error}`
      if (msg.includes('already been processed')) {
        toast.success('Fish already fed!')
        fishQuery.refetch()
        allFish.refetch()
        return
      }
      toast.error('Failed to feed fish', { description: msg })
    },
  })

  return { fishQuery, feedMutation }
}
