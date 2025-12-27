'use client';

import { useConnect, useAccount, useDisconnect, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { MetaMaskIcon, CoinbaseWalletIcon, RabbyIcon, KeplerIcon } from './WalletIcons';
import { useState, useEffect } from 'react';

const WALLET_CONFIGS = [
  {
    name: 'MetaMask',
    icon: MetaMaskIcon,
    connectorIndex: 0, // First connector in wagmi config
  },
  {
    name: 'Coinbase Wallet',
    icon: CoinbaseWalletIcon,
    connectorIndex: 1, // Second connector in wagmi config
  },
  {
    name: 'Rabby',
    icon: RabbyIcon,
    connectorIndex: 2, // Third connector in wagmi config (injected with target: 'rabby')
  },
  {
    name: 'Kepler',
    icon: KeplerIcon,
    connectorIndex: 3, // Fourth connector in wagmi config (injected)
  },
];

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const [showDropdown, setShowDropdown] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Return null during SSR to prevent hydration errors
  if (!isMounted) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-zinc-800 to-zinc-700 border border-zinc-700">
        <span className="text-sm font-medium text-white">Connect Wallet</span>
      </div>
    );
  }

  // Map wallet configs to actual connectors by index
  // Connectors are in the same order as defined in wagmi config
  const walletOptions = WALLET_CONFIGS.map((wallet) => {
    const connector = connectors[wallet.connectorIndex];
    return { ...wallet, connector };
  }).filter((w) => w.connector); // Filter out wallets without connectors

  const handleConnect = (connector: any) => {
    if (connector) {
      connect({ connector });
      setShowDropdown(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
  };

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all border border-blue-500/30"
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium text-white">
            {`${address.slice(0, 6)}...${address.slice(-4)}`}
          </span>
          {balance && (
            <span className="text-xs text-blue-100">
              {parseFloat(formatEther(balance.value)).toFixed(4)} ETH
            </span>
          )}
          <svg
            className={`w-4 h-4 text-white transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl z-50">
              <div className="p-3 border-b border-zinc-800">
                <p className="text-xs text-zinc-400 mb-1">Connected</p>
                <p className="text-sm font-medium text-white truncate">{address}</p>
                {balance && (
                  <p className="text-xs text-zinc-400 mt-1">
                    {parseFloat(formatEther(balance.value)).toFixed(4)} ETH
                  </p>
                )}
              </div>
              <button
                onClick={handleDisconnect}
                className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
              >
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-zinc-700 hover:to-zinc-600 transition-all border border-zinc-700"
      >
        <span className="text-sm font-medium text-white">Connect Wallet</span>
        <svg
          className={`w-4 h-4 text-white transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl z-50">
            <div className="p-3 border-b border-zinc-800">
              <p className="text-sm font-medium text-white">Select Wallet</p>
            </div>
            <div className="p-2">
              {walletOptions.map((wallet) => {
                const Icon = wallet.icon;
                return (
                  <button
                    key={wallet.name}
                    onClick={() => handleConnect(wallet.connector)}
                    disabled={!wallet.connector || isPending}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon className="w-6 h-6 text-white" />
                    <span className="text-sm font-medium text-white">{wallet.name}</span>
                    {isPending && (
                      <div className="ml-auto w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

