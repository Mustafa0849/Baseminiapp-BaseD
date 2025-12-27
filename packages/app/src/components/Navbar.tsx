'use client';

import { WalletButton } from './WalletButton';

export function Navbar() {
  return (
    <nav className="relative z-50 w-full border-b border-zinc-800 bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white">BaseD</h1>
        </div>
        <div className="flex items-center">
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}

