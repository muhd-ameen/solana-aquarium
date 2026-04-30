import { AppHero } from '@/components/app-hero'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function DashboardFeature() {
  return (
    <div>
      <AppHero
        title="🐠 Solana Aquarium"
        subtitle="A shared on-chain fish tank. Every user mints a fish — it lives in everyone's tank, forever."
      >
        <div className="flex gap-4 justify-center mt-4">
          <Link href="/tank">
            <Button size="lg">Enter the Tank</Button>
          </Link>
        </div>
      </AppHero>
      <div className="max-w-xl mx-auto py-6 text-center space-y-2">
        <p className="text-muted-foreground">
          Connect your wallet, mint a fish with random traits, feed it to keep it alive, and watch the community
          aquarium grow.
        </p>
      </div>
    </div>
  )
}
