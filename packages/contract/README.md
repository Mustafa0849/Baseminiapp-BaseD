# TrustPulse Smart Contracts

Smart contracts for the TrustPulse undercollateralized lending protocol.

## Contracts

### CreditManager
Manages user credit scores based on EAS attestations (Coinbase Verification).

### LendingPool
Simplified lending pool that uses CreditManager to determine MaxLTV ratios.

## Setup

1. Install Foundry dependencies:
```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install ethereum-attestation-service/eas-contracts
forge install transmissions11/solmate
```

2. Compile contracts:
```bash
forge build
```

3. Run tests:
```bash
forge test
```

4. Deploy to Base Sepolia:
```bash
# Set your private key in .env
export PRIVATE_KEY=your_private_key

# Deploy
forge script script/Deploy.s.sol:DeployScript --rpc-url base-sepolia --broadcast --verify
```

## Configuration

Before deploying, update the following in `script/Deploy.s.sol`:
- `EAS_ADDRESS`: The actual EAS contract address on Base Sepolia
- `COINBASE_VERIFICATION_SCHEMA`: The actual schema UID for Coinbase Verification

## Testing

Run all tests:
```bash
forge test
```

Run with verbosity:
```bash
forge test -vvv
```

