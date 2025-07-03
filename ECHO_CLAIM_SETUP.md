# ECHO Token Claim System Setup

## Overview
This system allows users to claim their accumulated ECHO token balance through a secure voucher system using the DistributorUpgradeable smart contract. Users accumulate ECHO tokens through various activities and can claim their entire balance at any time.

## Smart Contract Addresses (World Chain Mainnet)
- **ECHO Token**: `0xEDE26E239947d5203942b8A297E755a6B44DcdA8`
- **Distributor**: `0x46090D7eFC5317F55859B14053dB68f66b220e01`

## Setup Instructions

### 1. Backend Configuration

First, install the required dependency in the backend:

```bash
cd backend
npm install ethers
```

Add the following to your `.env` file in the `backend` directory:

```env
# Private key of the signer wallet authorized in the Distributor contract
# This wallet signs vouchers but doesn't hold tokens
ECHO_DISTRIBUTOR_PRIVATE_KEY=your_signer_private_key_here
```

**Note**: Make sure your `.env` file also contains the other required variables like `MONGODB_URI`, `OPENAI_API_KEY`, etc.

**⚠️ IMPORTANT**: 
- Never commit the `.env` file to version control
- The private key should be for the signer address configured in the Distributor contract
- This wallet only signs vouchers; the tokens are held by the Distributor contract

### 2. Frontend Implementation

The system includes:
- **"Claim X ECHO" button**: Shows current balance and allows claiming
- **Balance display**: Real-time display of accumulated ECHO
- **World App integration**: Uses MiniKit for transaction sending

### 3. How It Works

1. User accumulates ECHO through:
   - 0.5 ECHO every 3 hours (automatic)
   - 0.1 ECHO on first daily connection
   - 5 ECHO per message sent (max 100/day)
2. User clicks "Claim X ECHO" button when balance > 0
3. Backend API (`/api/echo-claim`) is called with userId and userAddress
4. Backend:
   - Retrieves user's current ECHO balance
   - Creates a voucher for the full balance amount
   - Signs the voucher using EIP-712 standard
   - Returns transaction data for MiniKit
5. Frontend uses MiniKit.sendTransaction to execute the claim
6. User approves transaction in World App
7. Distributor contract validates signature and transfers tokens
8. User's balance is reset to 0

### 4. Security Features

- **Balance Verification**: User can only claim their actual balance
- **Signature Verification**: Only vouchers signed by authorized signer are valid
- **Time-based Nonce**: Prevents replay attacks
- **1-hour Deadline**: Vouchers expire after 1 hour
- **Server-side Balance**: Balance stored and managed only on server

### 5. Testing

1. Ensure the Distributor contract has ECHO tokens
2. Ensure the signer address is authorized in the Distributor contract
3. Test with a World App wallet
4. Check that daily limits are enforced
5. Verify transaction appears on World Chain explorer

### 6. Monitoring

- Check backend logs for voucher creation
- Monitor Distributor contract balance
- Track daily claim statistics in backend logs

## Troubleshooting

**"Service temporarily unavailable"**
- Check that `ECHO_DISTRIBUTOR_PRIVATE_KEY` is set in `.env`

**"No ECHO balance to claim"**
- User needs to accumulate ECHO tokens first by playing

**"Valid user wallet address required"**
- User needs to connect their World Wallet first

**Transaction fails in World App**
- Check that Distributor contract has sufficient ECHO tokens
- Verify signer is authorized in the contract
- Check voucher deadline hasn't expired 