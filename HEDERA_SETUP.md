# Hedera NFT Minting Setup Guide

This guide explains how to set up Hedera Token Service (HTS) NFT minting for the Serenity Badge system.

## Prerequisites

1. **Hedera Account**: Create a Hedera testnet or mainnet account
   - Testnet: Use the [Hedera Portal](https://portal.hedera.com/)
   - Mainnet: Create account via a supported wallet

2. **MongoDB**: Set up a MongoDB instance
   - Local: Install MongoDB locally
   - Cloud: Use MongoDB Atlas (recommended)

3. **IPFS Node**: Set up IPFS for metadata storage
   - Local: Install IPFS Desktop or CLI
   - Cloud: Use Pinata, Infura, or similar service

## Configuration Steps

### 1. Create NFT Collection

Before minting individual NFTs, you need to create an NFT collection (token) on Hedera:

```javascript
// Example using Hedera SDK
import { 
  Client, 
  TokenCreateTransaction, 
  TokenType, 
  TokenSupplyType 
} from '@hashgraph/sdk';

const client = Client.forTestnet();
client.setOperator(operatorId, operatorKey);

const transaction = await new TokenCreateTransaction()
  .setTokenName('TestZen Serenity Badge')
  .setTokenSymbol('ZEN')
  .setTokenType(TokenType.NonFungibleUnique)
  .setDecimals(0)
  .setInitialSupply(0)
  .setTreasuryAccountId(operatorId)
  .setSupplyType(TokenSupplyType.Infinite)
  .setSupplyKey(operatorKey)
  .setAdminKey(operatorKey)
  .freezeWith(client);

const txResponse = await transaction.execute(client);
const receipt = await txResponse.getReceipt(client);
const tokenId = receipt.tokenId;

console.log(`NFT Collection created: ${tokenId}`);
```

Save the `tokenId` for use in environment variables.

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
# Copy example file
cp .env.example .env
```

Configure the following variables:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/testzen
# Or for Atlas: mongodb+srv://username:password@cluster.mongodb.net/testzen

# Hedera Network
HEDERA_NETWORK=testnet  # or mainnet
HEDERA_OPERATOR_ID=0.0.12345  # Your Hedera account ID
HEDERA_OPERATOR_KEY=302e020100...  # Your private key (keep secret!)
HEDERA_NFT_TOKEN_ID=0.0.67890  # Token ID from step 1

# IPFS
IPFS_HOST=localhost  # or ipfs.infura.io
IPFS_PORT=5001
IPFS_PROTOCOL=http  # or https
IPFS_GATEWAY=https://ipfs.io/ipfs  # or https://gateway.pinata.cloud/ipfs
```

### 3. Token Association

Users must associate the NFT token with their Hedera account before receiving NFTs.

**Frontend Integration:**

```javascript
// Using HashConnect or similar wallet
async function associateToken() {
  const transaction = new TokenAssociateTransaction()
    .setAccountId(userAccountId)
    .setTokenIds([tokenId]);
  
  // Sign with user's wallet
  const signedTx = await hashConnect.signTransaction(transaction);
  const txResponse = await signedTx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  
  return receipt.status === Status.Success;
}
```

### 4. Test the Setup

Run the test suite to verify configuration:

```bash
npm test
```

Test with a manual mint request:

```bash
curl -X POST http://localhost:3000/api/nft/mint \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0.0.12345",
    "userId": "test-user",
    "level": 5,
    "totalXP": 2500,
    "sessionsCompleted": 27,
    "gardenTiles": [
      {"id": 0, "completed": true},
      {"id": 1, "completed": true},
      {"id": 2, "completed": true},
      {"id": 3, "completed": true},
      {"id": 4, "completed": true},
      {"id": 5, "completed": true},
      {"id": 6, "completed": true},
      {"id": 7, "completed": true},
      {"id": 8, "completed": true}
    ]
  }'
```

## Security Best Practices

### Private Key Management

1. **Never commit private keys to version control**
2. Use environment variables or secret management services
3. Rotate keys periodically
4. Use separate keys for testnet and mainnet

### Production Considerations

1. **Use a secure key management system** (AWS KMS, HashiCorp Vault, etc.)
2. **Implement rate limiting** on the mint endpoint
3. **Add authentication** to verify user identity
4. **Monitor transaction costs** and set up alerts
5. **Implement retry logic** for transient failures
6. **Set up logging and monitoring** for all mint operations

## API Documentation

### POST /api/nft/mint

Mints a Serenity Badge NFT for a user who has completed their garden grid.

**Request Body:**
```json
{
  "walletAddress": "0.0.12345",
  "userId": "user123",
  "level": 5,
  "totalXP": 2500,
  "sessionsCompleted": 27,
  "gardenTiles": [
    { "id": 0, "completed": true },
    ...
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "tokenId": "0.0.98765",
  "serialNumber": 1,
  "transactionId": "0.0.12345@1234567890.123456789",
  "metadataCID": "QmXxx...",
  "metadata": {
    "name": "Serenity Badge - Zen Garden Master",
    "description": "...",
    "attributes": [...],
    ...
  },
  "mintedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- `400`: Validation error (missing fields, incomplete grid, already minted)
- `500`: Server error (IPFS, Hedera, or database failure)

## Troubleshooting

### Common Issues

1. **"Invalid Hedera account ID format"**
   - Ensure account ID follows format: `0.0.xxxxx`
   - Check for typos in `.env` file

2. **"Token association required"**
   - User must associate the token before receiving NFT
   - Implement frontend flow for token association

3. **"Insufficient balance"**
   - Operator account needs HBAR for transaction fees
   - Mint costs ~$0.05 per NFT on mainnet

4. **"IPFS upload failed"**
   - Check IPFS node is running
   - Verify IPFS connection settings
   - Try alternative IPFS gateway

5. **"MongoDB connection failed"**
   - Verify MongoDB is running
   - Check connection string in `.env`
   - Ensure database user has proper permissions

## Monitoring

Monitor the following metrics:

- **Mint success rate**: Track failed vs successful mints
- **Transaction costs**: Monitor HBAR spending
- **Response times**: IPFS upload and Hedera transaction times
- **Database performance**: Query times and connection pool status
- **Error rates**: Track and alert on specific error types

## Cost Estimates

### Hedera Mainnet Costs
- Token creation: ~$1 USD (one-time)
- NFT mint: ~$0.05 USD per NFT
- Token association: ~$0.05 USD (paid by user)

### Infrastructure Costs
- MongoDB Atlas: Free tier or ~$10/month
- IPFS hosting: Free (self-hosted) or ~$5-20/month
- Server hosting: Varies by provider

## Support

For issues or questions:
- Hedera: [Discord](https://hedera.com/discord)
- MongoDB: [Community Forums](https://www.mongodb.com/community/forums/)
- IPFS: [Discussion Forum](https://discuss.ipfs.io/)
