# TrustPulse

An undercollateralized lending protocol on the Base network that uses on-chain identity (Coinbase Verification via EAS) and Farcaster social reputation to determine credit limits.

## Project Structure

```
TrustPulse/
├── packages/
│   ├── contract/          # Foundry smart contracts
│   └── app/               # Next.js frontend
├── package.json           # Root workspace configuration
└── README.md
```

## Tech Stack

### Smart Contracts
- **Framework**: Foundry (Forge)
- **Language**: Solidity ^0.8.20
- **Standards**: ERC20, ERC4626, EAS (Ethereum Attestation Service)
- **Network**: Base Sepolia (Testnet)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3 Libraries**: Wagmi, Viem, Tanstack Query
- **Base Components**: OnchainKit

## Installation

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Foundry (Forge) - [Installation Guide](https://book.getfoundry.sh/getting-started/installation)

### Setup Steps

1. **Install Foundry** (if not already installed):
   
   **Windows (PowerShell):**
   ```powershell
   # Download from https://github.com/foundry-rs/foundry/releases
   # Or use WSL2/Git Bash and follow Linux instructions
   ```
   
   **macOS/Linux:**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Install root dependencies**:
   ```bash
   npm install
   ```

3. **Install contract dependencies**:
   ```bash
   cd packages/contract
   forge install OpenZeppelin/openzeppelin-contracts
   forge install ethereum-attestation-service/eas-contracts
   forge install transmissions11/solmate
   ```

4. **Install frontend dependencies**:
   ```bash
   cd packages/app
   npm install
   ```

5. **Set up environment variables**:
   ```bash
   cd packages/app
   # Create .env.local file (see INSTALLATION.md for details)
   ```

## Development

### Smart Contracts

```bash
# Compile contracts
cd packages/contract
forge build

# Run tests
forge test

# Deploy to Base Sepolia
forge script script/Deploy.s.sol:DeployScript --rpc-url base-sepolia --broadcast --verify
```

### Frontend

```bash
# Run development server
npm run dev

# Build for production
npm run build
```

## Contracts Overview

### CreditManager
Manages user credit scores based on EAS attestations (Coinbase Verification) and Farcaster reputation.

### LendingPool
Simplified lending pool that uses CreditManager to determine MaxLTV (Loan-to-Value) ratios.

## License

MIT

