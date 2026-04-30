export function AppFooter() {
  return (
    <footer className="border-t border-border/50 py-4">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Solana Aquarium &mdash; a shared on-chain fish tank</span>
        <div className="flex items-center gap-3">
          <a
            className="hover:text-foreground transition-colors"
            href="https://github.com/muhd-ameen/solana-aquarium"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <span className="text-border">·</span>
          <span>Devnet</span>
        </div>
      </div>
    </footer>
  )
}
