# NFT Minting Implementation Documentation

## Overview

This document describes the implementation of Serenity Badge NFT minting via Hedera Token Service (HTS) for users who complete the 3×3 garden grid.

## Architecture

### Components

1. **lib/hedera.ts** - Hedera Token Service integration
2. **lib/ipfs.ts** - IPFS metadata upload functionality
3. **lib/mongodb.ts** - MongoDB connection management
4. **models/Garden.ts** - Garden document schema
5. **app/api/nft/mint/route.ts** - NFT minting API endpoint
6. **__tests__/api/nft/mint.test.ts** - Comprehensive test suite

## Implementation Details

### 1. Hedera Token Service (`lib/hedera.ts`)

**Key Functions:**
- `getHederaClient()` - Initializes and caches Hedera client
- `validateTokenId(tokenId)` - Validates token ID format
- `validateAccountId(accountId)` - Validates Hedera account ID format
- `mintNFT(recipientAccountId, metadataCID)` - Mints NFT and transfers to user
- `associateToken(accountId, accountKey, tokenId)` - Associates token with account

**Features:**
- Singleton client pattern for connection reuse
- Support for both testnet and mainnet
- Automatic token transfer after minting
- Comprehensive error handling
- Transaction receipt verification

**Environment Variables:**
```
HEDERA_NETWORK=testnet|mainnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e020100...
HEDERA_NFT_TOKEN_ID=0.0.xxxxx
```

### 2. IPFS Integration (`lib/ipfs.ts`)

**Key Functions:**
- `getIPFSClient()` - Initializes IPFS client
- `uploadMetadataToIPFS(metadata)` - Uploads JSON metadata to IPFS
- `uploadImageToIPFS(imageBuffer)` - Uploads images to IPFS
- `getIPFSUrl(cid)` - Constructs IPFS gateway URLs

**Metadata Structure:**
```typescript
{
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  level: number;
  totalXP: number;
  completionDate: string;
  reflectionHash: string;
}
```

**Environment Variables:**
```
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http
IPFS_GATEWAY=https://ipfs.io/ipfs
```

### 3. MongoDB Integration (`lib/mongodb.ts`)

**Features:**
- Connection caching and reuse
- Automatic reconnection handling
- Environment-based configuration

**Environment Variables:**
```
MONGODB_URI=mongodb://localhost:27017/testzen
```

### 4. Garden Model (`models/Garden.ts`)

**Schema:**
```typescript
{
  userId: string;           // User identifier
  walletAddress: string;    // Hedera account ID
  tiles: [                  // Garden grid state
    {
      id: number;
      completed: boolean;
      sessionType?: string;
      completedAt?: Date;
    }
  ];
  nftMinted: boolean;       // Minting status flag
  nftMetadata?: {           // Minted NFT data
    tokenId: string;
    serialNumber: string;
    cid: string;
    transactionId: string;
    mintedAt: Date;
    level: number;
    totalXP: number;
    completionDate: Date;
    reflectionHash: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ userId: 1, walletAddress: 1 }` - Unique compound index

### 5. Minting API (`app/api/nft/mint/route.ts`)

**Endpoint:** `POST /api/nft/mint`

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
    "level": 5,
    "totalXP": 2500,
    "completionDate": "2024-01-01T00:00:00.000Z",
    "reflectionHash": "abc123..."
  },
  "mintedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**

| Status | Error | Reason |
|--------|-------|--------|
| 400 | Wallet address is required | Missing walletAddress |
| 400 | User ID is required | Missing userId |
| 400 | Garden tiles data is required | Missing gardenTiles |
| 400 | Invalid Hedera account ID format | Invalid account format |
| 400 | Badge already minted | Idempotency check |
| 400 | Garden grid is not complete | Not all tiles completed |
| 400 | Insufficient sessions completed | Less than 9 sessions |
| 500 | Failed to upload metadata to IPFS | IPFS error |
| 500 | Failed to mint NFT on Hedera network | Hedera error |
| 500 | NFT minted but failed to update records | DB error after mint |

**Flow:**

1. **Validation**
   - Verify required fields present
   - Validate Hedera account ID format

2. **Database Check**
   - Connect to MongoDB
   - Find or create Garden document

3. **Idempotency Check**
   - Return existing NFT data if already minted

4. **Eligibility Verification**
   - Check all 9 tiles completed
   - Verify minimum 9 sessions

5. **Metadata Generation**
   - Create reflection hash (SHA-256 of journey data)
   - Build badge metadata with attributes

6. **IPFS Upload**
   - Upload metadata JSON to IPFS
   - Get CID (Content Identifier)

7. **Hedera Minting**
   - Mint NFT with metadata CID
   - Transfer NFT to user account
   - Get transaction ID and serial number

8. **Database Update**
   - Save minted NFT data to Garden document
   - Set nftMinted flag to true

9. **Rollback on Failure**
   - If DB update fails after mint, log critical error
   - If other errors, attempt to rollback DB changes

### 6. Testing (`__tests__/api/nft/mint.test.ts`)

**Test Coverage:**

- ✅ Success path with eligible user
- ✅ Validation errors (missing fields, invalid formats)
- ✅ Idempotency (already minted check)
- ✅ Eligibility checks (incomplete grid, insufficient sessions)
- ✅ Error handling (IPFS, Hedera, DB failures)
- ✅ Rollback on errors
- ✅ Metadata generation with reflection hash

**Run Tests:**
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

## Key Features

### 1. Idempotency

The API ensures idempotent operations:
- Checks if NFT already minted before processing
- Returns existing NFT data if duplicate request
- Prevents double-minting for the same user

### 2. Secure Server-to-Server Signing

- Operator private key stored server-side only
- Client never has access to signing keys
- Transaction signed on backend
- Transaction ID returned to client for verification

### 3. Graceful Error Handling

- Specific error messages for each failure type
- Rollback attempted on errors
- Critical errors logged for manual recovery
- User-friendly error responses

### 4. Reflection Hash

A unique hash summarizing the user's journey:
```javascript
const reflectionData = `${userId}-${walletAddress}-${totalXP}-${sessionsCompleted}-${level}`;
const reflectionHash = crypto.createHash('sha256')
  .update(reflectionData)
  .digest('hex')
  .substring(0, 16);
```

### 5. Badge Metadata

Comprehensive metadata stored on-chain:
- Level achieved
- Total XP earned
- Sessions completed
- Completion date
- Journey hash
- Legendary rarity

## Security Considerations

### Private Key Management

✅ **Implemented:**
- Environment variable storage
- Server-side only access
- Never exposed to client

⚠️ **Production Recommendations:**
- Use AWS KMS, HashiCorp Vault, or similar
- Rotate keys periodically
- Separate keys for testnet/mainnet
- Audit key access

### API Security

✅ **Implemented:**
- Input validation
- Type checking
- Error sanitization

⚠️ **Production Recommendations:**
- Add authentication (JWT, OAuth)
- Implement rate limiting
- Add CORS restrictions
- Enable request logging
- Add DDoS protection

### Data Integrity

✅ **Implemented:**
- Idempotency checks
- Transaction receipts
- Reflection hash for verification

## Monitoring & Observability

### Recommended Metrics

1. **Success Rate**
   - Track minted vs failed requests
   - Alert on high failure rate

2. **Performance**
   - IPFS upload time
   - Hedera transaction time
   - End-to-end API latency

3. **Costs**
   - HBAR spent on minting
   - IPFS storage costs
   - MongoDB operations

4. **Errors**
   - Error type breakdown
   - Critical errors requiring manual recovery

### Logging

The implementation includes comprehensive logging:
- Info: Successful operations
- Error: Failed operations with details
- Critical: NFT minted but DB update failed (requires manual recovery)

## Deployment Checklist

- [ ] Set all environment variables
- [ ] Create NFT token on Hedera
- [ ] Fund operator account with HBAR
- [ ] Configure MongoDB connection
- [ ] Set up IPFS node or service
- [ ] Run test suite
- [ ] Test with testnet first
- [ ] Set up monitoring and alerts
- [ ] Configure backup and recovery
- [ ] Document support procedures

## Cost Estimates

### Per Mint Operation

**Hedera Mainnet:**
- Token creation (one-time): ~$1 USD
- NFT mint: ~$0.05 USD
- NFT transfer: Included in mint
- Token association (user pays): ~$0.05 USD

**Infrastructure (Monthly):**
- MongoDB: Free tier or $10-50
- IPFS: Free (self-hosted) or $5-20
- Server: Varies by provider

**Example: 1000 mints/month**
- Hedera: $50
- Infrastructure: $15-70
- Total: ~$65-120/month

## Troubleshooting

See [HEDERA_SETUP.md](./HEDERA_SETUP.md) for detailed troubleshooting guide.

### Common Issues

1. **"Invalid Hedera account ID format"**
   - Ensure format is `0.0.xxxxx`
   - Check for typos

2. **"Token association required"**
   - User must associate token first
   - Implement frontend flow

3. **"Insufficient balance"**
   - Top up operator account
   - Monitor HBAR balance

4. **"IPFS upload failed"**
   - Check IPFS node running
   - Verify connectivity
   - Try alternative gateway

## Next Steps

### Potential Enhancements

1. **Frontend Integration**
   - Wallet connection (HashConnect)
   - Token association flow
   - Mint progress UI
   - Transaction confirmation

2. **Advanced Features**
   - Batch minting
   - NFT burning for rewards
   - Metadata updates
   - Royalty configuration

3. **Analytics**
   - Dashboard for mint statistics
   - User journey analytics
   - Cost tracking

4. **Optimization**
   - Queue system for high volume
   - Caching for frequent queries
   - Batch IPFS uploads
   - Connection pooling

## Support

For questions or issues:
- Review this documentation
- Check [HEDERA_SETUP.md](./HEDERA_SETUP.md)
- Run test suite for debugging
- Check application logs
- Verify environment variables

## References

- [Hedera SDK Documentation](https://docs.hedera.com/hedera/sdks-and-apis/sdks)
- [IPFS Documentation](https://docs.ipfs.io/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
