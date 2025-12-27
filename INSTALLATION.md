# TrustPulse Installation Guide

Complete step-by-step installation instructions for the TrustPulse monorepo.

## Prerequisites

### Required Software

1. **Node.js 18+**
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version`

2. **npm or yarn**
   - Comes with Node.js
   - Verify: `npm --version`

3. **Foundry (Forge)**
   - **Windows**: Download from [Foundry Releases](https://github.com/foundry-rs/foundry/releases)
   - **macOS/Linux**: 
     ```bash
     curl -L https://foundry.paradigm.xyz | bash
     foundryup
     ```
   - Verify: `forge --version`

4. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify: `git --version`

## Installation Steps

### 1. Clone or Navigate to Project

```bash
cd TrustPulse
```

### 2. Install Root Dependencies

```bash
npm install
```

This installs workspace-level dependencies and sets up the monorepo structure.

### 3. Set Up Smart Contracts

```bash
cd packages/contract
```

Install Foundry dependencies:

```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install ethereum-attestation-service/eas-contracts
forge install transmissions11/solmate
```

Compile contracts:

```bash
forge build
```

Run tests:

```bash
forge test
```

### 4. Set Up Frontend

```bash
cd ../app
```

Install dependencies:

```bash
npm install
```

Create environment file:

Create a `.env.local` file in `packages/app/` with:

```env
# Base Sepolia Network
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org

# Contract Addresses (update after deployment)
NEXT_PUBLIC_CREDIT_MANAGER_ADDRESS=
NEXT_PUBLIC_LENDING_POOL_ADDRESS=

# EAS Configuration
NEXT_PUBLIC_EAS_ADDRESS=0x4200000000000000000000000000000000000021
NEXT_PUBLIC_COINBASE_VERIFICATION_SCHEMA=

# WalletConnect (optional - get from walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

### 5. Deploy Contracts (Optional for Development)

Before deploying, update `packages/contract/script/Deploy.s.sol` with:
- Actual EAS contract address on Base Sepolia
- Actual Coinbase Verification schema UID

Then deploy:

```bash
cd packages/contract
export PRIVATE_KEY=your_private_key_here
forge script script/Deploy.s.sol:DeployScript --rpc-url base-sepolia --broadcast --verify
```

After deployment, update the contract addresses in `packages/app/.env.local`.

## Running the Application

### Development Mode

**Frontend:**
```bash
cd packages/app
npm run dev
```

Visit `http://localhost:3000`

**Smart Contracts:**
```bash
cd packages/contract
forge test        # Run tests
forge build       # Compile
```

### Production Build

```bash
cd packages/app
npm run build
npm start
```

## Troubleshooting

### Foundry Installation Issues

**Windows:**
- Ensure you have WSL2 or use Git Bash
- Alternatively, use the Windows installer from Foundry releases

**macOS:**
- If `foundryup` fails, try: `brew install foundry`

### Contract Compilation Errors

- Ensure all dependencies are installed: `forge install`
- Check Solidity version matches `foundry.toml`
- Verify remappings in `foundry.toml`

### Frontend Build Errors

- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

### Environment Variables

- Ensure `.env.local` exists in `packages/app/`
- All `NEXT_PUBLIC_*` variables must be set for frontend to work
- Contract addresses must be valid `0x` addresses

## Next Steps

1. **Deploy contracts** to Base Sepolia
2. **Update environment variables** with deployed addresses
3. **Test the frontend** connection to contracts
4. **Register EAS attestations** for testing credit scores
5. **Test lending/borrowing** functionality

## Additional Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [OnchainKit Documentation](https://onchainkit.xyz/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Base Network Docs](https://docs.base.org/)

