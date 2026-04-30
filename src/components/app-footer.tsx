import React from 'react'

export function AppFooter() {
  return (
    <footer className="text-center p-3 bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 text-xs flex items-center justify-center gap-1">
      <span>Solana Aquarium</span>
      <span className="text-neutral-300 dark:text-neutral-600">·</span>
      <a
        className="hover:text-neutral-500 dark:hover:text-white"
        href="https://github.com/muhd-ameen/solana-aquarium"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
      <span className="text-neutral-300 dark:text-neutral-600">·</span>
      <span>Built on Solana devnet</span>
    </footer>
  )
}
