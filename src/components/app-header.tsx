'use client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { ClusterUiSelect } from './cluster/cluster-ui'
import { WalletButton } from '@/components/solana/solana-provider'

export function AppHeader({ links = [] }: { links: { label: string; path: string }[] }) {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)

  function isActive(path: string) {
    return path === '/' ? pathname === '/' : pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl flex justify-between items-center px-4 h-14">
        <div className="flex items-center gap-6">
          <Link className="flex items-center gap-2 font-semibold text-lg tracking-tight hover:opacity-80 transition-opacity" href="/">
            <span className="text-xl">🐠</span>
            <span>Aquarium</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ label, path }) => (
              <Link
                key={path}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(path)
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
                href={path}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMenu(!showMenu)}>
          {showMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <div className="hidden md:flex items-center gap-2">
          <ClusterUiSelect />
          <WalletButton />
        </div>

        {showMenu && (
          <div className="md:hidden fixed inset-x-0 top-14 bottom-0 bg-background/95 backdrop-blur-xl">
            <div className="flex flex-col p-4 gap-3 border-t border-border/50">
              {links.map(({ label, path }) => (
                <Link
                  key={path}
                  className={`px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive(path)
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                  href={path}
                  onClick={() => setShowMenu(false)}
                >
                  {label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-3 border-t border-border/50">
                <ClusterUiSelect />
                <WalletButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
