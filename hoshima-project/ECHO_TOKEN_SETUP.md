# ECHO Token Distribution Setup

This document explains how the "Grab 1 ECHO" button works in the Hoshima application.

## Overview

The ECHO token distribution system allows users to claim 1 ECHO token per day through a simple button in the chat interface. The system uses a server-side distribution mechanism where the backend handles the actual token transfer.

## Architecture

### Frontend (TerminalChat.tsx)
- **Button**: Located next to the console button
- **Claim Limit**: 1 ECHO per user per day (tracked locally for UI)
- **Request**: Sends userId and userAddress to backend
- **Feedback**: Real-time status messages and animations

### Backend (/api/echo-claim)
- **Rate Limiting**: Enforces 1 token per user per day (by userId)
- **Transaction Execution**: Backend sends tokens directly using ethers.js
- **Security**: Server-side transaction signing
- **Wallet Management**: Uses distributor wallet with private key

### Smart Contract
- **ECHO Token**: `0xEDE26E239947d5203942b8A297E755a6B44DcdA8`
- **Chain**: Worldchain (Chain ID: 480)
- **Distribution**: Backend sends from distributor wallet to user

## Environment Variables

Add these to your `.env.local` file:

```
# Wallet that holds ECHO tokens for distribution
ECHO_DISTRIBUTOR_ADDRESS=0x[your_distributor_wallet_address]
ECHO_DISTRIBUTOR_PRIVATE_KEY=[your_distributor_private_key]
```

⚠️ **Security Warning**: 
- Never commit private keys to version control!
- Use environment variables or secure key management services
- Consider using a separate low-balance wallet for distribution

## Setup Instructions

1. **Deploy ECHO Token** (if not already deployed)
   ```bash
   cd smart-contracts
   forge script Deployer/DeployUpgradableContracts.s.sol --rpc-url https://worldchain-mainnet.g.alchemy.com/public --broadcast
   ```

2. **Create Distributor Wallet**
   - Generate a new wallet specifically for distribution
   - Fund it with WLD for gas fees
   - Transfer ECHO tokens to this wallet (start with 1000 ECHO for testing)

3. **Configure Environment**
   - Set `ECHO_DISTRIBUTOR_ADDRESS` in `.env.local`
   - Set `ECHO_DISTRIBUTOR_PRIVATE_KEY` in `.env.local`
   - Ensure these are NEVER exposed to the frontend

4. **Test the System**
   - Open app in World App
   - Click "Grab 1 ECHO" button
   - Verify transaction on chain
   - Check 24-hour cooldown works

## How It Works

1. User clicks "Grab 1 ECHO" button
2. Frontend checks if user has already claimed today (local check)
3. Frontend sends request to `/api/echo-claim` with userId and userAddress
4. Backend verifies claim eligibility (1 per day limit)
5. Backend uses ethers.js to send 1 ECHO from distributor wallet
6. Transaction is signed server-side with distributor private key
7. Backend waits for confirmation and returns transaction hash
8. Frontend shows success message and updates local state

## Security Considerations

1. **Private Key Management**
   - Use a dedicated wallet for distribution only
   - Keep minimal ECHO balance (refill as needed)
   - Never expose private key to frontend
   - Consider using AWS KMS or similar for production

2. **Rate Limiting**
   - Backend enforces 1 claim per userId per day
   - In-memory storage (use Redis/DB for production)
   - Consider adding IP-based limits

3. **Transaction Safety**
   - All transfers happen server-side
   - Users cannot modify transaction amounts
   - Backend validates all inputs

## Troubleshooting

### "World App required"
- Ensure the app is opened in World App
- MiniKit must be installed and available

### "Daily claim limit reached"
- Wait 24 hours from last claim
- Backend tracks by userId, not address

### "User wallet address not found"
- User must be authenticated with World Wallet first
- Backend needs the user's wallet address

### "Distributor wallet has insufficient ECHO tokens"
- Check ECHO balance in distributor wallet
- Transfer more ECHO tokens to distributor

### "Service temporarily unavailable"
- Check if ECHO_DISTRIBUTOR_ADDRESS is set
- Check if ECHO_DISTRIBUTOR_PRIVATE_KEY is set
- Verify environment variables are loaded

### Transaction Failures
- Check distributor wallet has enough WLD for gas
- Verify RPC endpoint is working
- Check backend logs for detailed errors 