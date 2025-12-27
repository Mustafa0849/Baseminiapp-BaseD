import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { metaMask, coinbaseWallet, injected } from '@wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: 'BaseD' }),
    injected({ target: 'rabby' }), // Rabby Wallet
    injected(), // Kepler and other injected wallets
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});

