# Session API Documentation

## Overview

This document describes the meditation session lifecycle API endpoints that handle session management, Hedera blockchain proofing, XP calculation, and garden progression.

## Endpoints

### POST /api/session/start

Initiates a new meditation session for a user.

#### Request Body

```typescript
{
  hederaAccountId: string;     // Format: "0.0.12345"
  mode: string;                // "meditation" | "focus" | "breathwork" | "calm" | "gratitude"
  targetDuration: number;      // Minutes (1-120)
}
```

#### Response (200 OK)

```typescript
{
  success: true;
  sessionId: string;
  nonce: string;              // Cryptographic nonce for replay attack prevention
  mode: string;
  targetDuration: number;
  startTime: string;          // ISO 8601 timestamp
}
```

#### Features

- **Authentication**: Validates Hedera account ID format
- **User Management**: Creates new user if first session, updates `lastSessionAt` for existing users
- **Garden Initialization**: Creates initial 3x3 garden grid for new users
- **Nonce Generation**: Generates unique cryptographic nonce for session verification

#### Error Responses

- `400`: Invalid request parameters (Zod validation failure)
- `400`: Invalid Hedera account ID format
- `500`: Server error (database, etc.)

---

### POST /api/session/complete

Completes a meditation session with blockchain proofing and progression updates.

#### Request Body

```typescript
{
  sessionId: string;
  hederaAccountId: string;     // Format: "0.0.12345"
  mode: string;                // Same as start
  actualDuration: number;      // Actual minutes completed (1-120)
  signedProof: string;         // Base64-encoded signed proof
  encryptedReflection?: {      // Optional encrypted reflection data
    ciphertext: string;
    iv: string;
    salt: string;
  };
  reflectionText?: string;     // Placeholder for future encryption work
}
```

#### Response (200 OK)

```typescript
{
  success: true;
  sessionId: string;
  xpEarned: number;
  totalXP: number;
  level: number;
  gardenPreview: {
    tilesCompleted: number;
    totalTiles: number;
    nextTileId?: number;
    isGridComplete: boolean;
    completionDate?: string;   // ISO 8601 if grid complete
  };
  hcsMetadata?: {              // Optional - only if HCS configured
    topicId: string;
    sequenceNumber: number;
    consensusTimestamp: string;
  };
}
```

#### Features

1. **Signature Verification**: Verifies signed proof against session nonce
2. **XP Calculation**: Calculates XP based on duration and mode multipliers:
   - Meditation: 1.5x
   - Focus: 1.2x
   - Breathwork: 1.3x
   - Calm: 1.0x
   - Gratitude: 1.1x
3. **Level Progression**: Updates user level using formula: `floor(sqrt(totalXP / 100)) + 1`
4. **Garden Updates**: Marks next available tile as completed, detects 3x3 grid completion
5. **Hedera HCS Integration**: Publishes session summary to Hedera Consensus Service (optional)
6. **IPFS Upload**: Uploads encrypted reflections to IPFS (gracefully handles failures)

#### Error Responses

- `400`: Invalid request parameters
- `400`: Session already completed
- `401`: Invalid signature or proof
- `403`: Session belongs to different account
- `404`: Session not found
- `404`: User not found
- `500`: Server error

---

## Database Models

### User

```typescript
{
  hederaAccountId: string;     // Unique identifier
  lastSessionAt?: Date;
  totalXP: number;
  level: number;
  sessionsCompleted: number;
  totalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Session

```typescript
{
  userId: string;
  hederaAccountId: string;
  mode: string;
  duration: number;            // in minutes
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  xpEarned: number;
  nonce: string;               // For replay attack prevention
  hcsTopicId?: string;         // Hedera Consensus Service topic
  hcsSequenceNumber?: number;
  hcsConsensusTimestamp?: Date;
  signedProof?: string;
  encryptedReflection?: {
    ciphertext: string;
    iv: string;
    salt: string;
    hash: string;
    cid?: string;              // IPFS Content ID
  };
}
```

### Garden

```typescript
{
  userId: string;
  walletAddress: string;
  tiles: Array<{
    id: number;                // 0-8
    completed: boolean;
    sessionType?: string;
    completedAt?: Date;
  }>;
  nftMinted: boolean;
  nftMetadata?: {
    level: number;
    totalXP: number;
    completionDate: Date;
    tokenId?: string;
    serialNumber?: string;
    cid?: string;
    transactionId?: string;
    mintedAt?: Date;
  };
}
```

---

## Security Features

### Replay Attack Prevention

Each session includes a unique cryptographic nonce that must be included in the signed proof during completion. This prevents replay attacks where an attacker could resubmit a previous valid signature.

### Signature Verification

The `verifySignedProof` function validates:
1. Signature is base64-encoded and not empty
2. Decoded payload matches expected structure
3. Nonce matches session nonce
4. Session ID matches
5. Hedera account ID matches

*Note: Full cryptographic signature verification using Hedera SDK public key validation is planned for future implementation.*

---

## Environment Variables

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/testzen

# Hedera Network
HEDERA_NETWORK=testnet                    # or "mainnet"
HEDERA_OPERATOR_ID=0.0.12345
HEDERA_OPERATOR_KEY=302e...               # Private key

# Hedera Consensus Service (optional)
HEDERA_HCS_TOPIC_ID=0.0.9999

# IPFS/Web3.storage (optional)
WEB3_STORAGE_TOKEN=eyJ...
```

---

## Testing

The implementation includes comprehensive test coverage:

- **Integration Tests**: Full API endpoint testing with mocked dependencies
- **Unit Tests**: XP calculation, level progression, garden logic
- **Test Coverage**: 60+ tests covering happy paths, validation, and error scenarios

Run tests:
```bash
npm test -- __tests__/api/session    # Session API tests (28 tests)
npm test -- __tests__/utils          # Utility tests (32 tests)
```

---

## Hedera Consensus Service Integration

When `HEDERA_HCS_TOPIC_ID` is configured, session completion data is published to the HCS topic:

```typescript
{
  sessionId: string;
  userId: string;
  hederaAccountId: string;
  mode: string;
  duration: number;
  xpEarned: number;
  nonce: string;
  reflectionHash?: string;     // SHA-256 hash if reflection provided
  reflectionCID?: string;      // IPFS CID if uploaded
  timestamp: string;
}
```

The HCS metadata (topic ID, sequence number, consensus timestamp) is stored on the session document for audit trails and verification.

---

## Future Enhancements

1. **Full Signature Verification**: Implement Hedera SDK public key verification
2. **Client-side Encryption**: Complete end-to-end encryption for reflection data
3. **NFT Minting**: Automatic NFT minting when garden grid is completed
4. **Webhook Integration**: Real-time notifications for session events
5. **Analytics Dashboard**: Aggregate session statistics and user insights
