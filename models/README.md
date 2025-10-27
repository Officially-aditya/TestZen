# Mongoose Models

This directory contains the MongoDB/Mongoose data models for the TestZen application.

## Models

### User (`User.ts`)

Represents a user in the system, identified by their Hedera account ID.

**Fields:**
- `hederaAccountId` (string, required, unique) - Hedera account ID in format `0.0.xxxxx`
- `lastSessionAt` (Date, optional) - Timestamp of the last completed session
- `totalXP` (number, default: 0) - Total experience points earned
- `level` (number, default: 1) - Current user level
- `sessionsCompleted` (number, default: 0) - Total number of completed sessions
- `totalMinutes` (number, default: 0) - Total minutes of meditation/focus time
- `createdAt` (Date, auto) - Account creation timestamp
- `updatedAt` (Date, auto) - Last update timestamp

**Instance Methods:**
- `calculateCurrentLevel()` - Calculates the current level based on total XP
- `getNextLevelXP()` - Returns the XP required for the next level
- `getLevelProgress()` - Returns detailed progress information toward the next level

**Static Methods:**
- `findByHederaAccount(hederaAccountId)` - Finds a user by their Hedera account ID

**Export:** `User` (with `IUser` interface and `IUserModel` for type safety)

---

### Session (`Session.ts`)

Represents a meditation/focus session completed by a user.

**Fields:**
- `userId` (string, required, indexed) - Reference to the User document ID
- `hederaAccountId` (string, required, indexed) - User's Hedera account ID
- `walletAddress` (string, optional, indexed) - User's wallet address
- `mode` (enum, required) - Session mode: 'meditation', 'focus', 'breathwork', 'calm', or 'gratitude'
- `duration` (number, required) - Session duration in minutes
- `startTime` (Date, required) - Session start timestamp
- `endTime` (Date, optional) - Session end timestamp
- `completed` (boolean, default: false) - Whether the session was completed
- `xpEarned` (number, default: 0) - Experience points earned from this session
- `nonce` (string, required, unique) - Unique nonce for replay attack prevention
- `hcsTopicId` (string, optional) - Hedera Consensus Service topic ID
- `hcsSequenceNumber` (number, optional) - HCS sequence number
- `hcsConsensusTimestamp` (Date, optional) - HCS consensus timestamp
- `signedProof` (string, optional) - Signed proof payload from the client
- `encryptedReflection` (object, optional) - Encrypted reflection data
  - `ciphertext` (string, required) - Encrypted reflection text
  - `iv` (string, required) - Initialization vector
  - `salt` (string, required) - Encryption salt
  - `hash` (string, required) - SHA-256 hash for integrity verification
  - `cid` (string, optional) - IPFS CID of the uploaded reflection
- `createdAt` (Date, auto) - Session creation timestamp
- `updatedAt` (Date, auto) - Last update timestamp

**Indexes:**
- Compound index on `userId` + `completed`
- Compound index on `walletAddress` + `completed`
- Single indexes on `userId`, `hederaAccountId`, and `walletAddress`

**Export:** `SessionModel` (with `ISession` interface)

---

### Garden (`Garden.ts`)

Represents a user's 3×3 garden grid that tracks meditation progress.

**Fields:**
- `userId` (string, required, indexed) - Reference to the User document ID
- `walletAddress` (string, required, indexed) - User's wallet address
- `tiles` (array, required) - 9 tiles representing the 3×3 grid
  - `id` (number, required) - Tile ID (0-8)
  - `completed` (boolean, default: false) - Whether the tile has been completed
  - `sessionType` (string, optional) - Type of session that completed this tile
  - `completedAt` (Date, optional) - Timestamp when the tile was completed
- `nftMinted` (boolean, default: false) - Whether the garden NFT has been minted
- `nftMetadata` (object, optional) - NFT metadata when garden is completed
  - `tokenId` (string, optional) - Hedera token ID
  - `serialNumber` (string, optional) - NFT serial number
  - `cid` (string, optional) - IPFS CID of the NFT metadata
  - `transactionId` (string, optional) - Hedera transaction ID
  - `mintedAt` (Date, optional) - NFT minting timestamp
  - `level` (number, required) - User level at completion
  - `totalXP` (number, required) - User total XP at completion
  - `completionDate` (Date, required) - Garden completion date
  - `reflectionHash` (string, optional) - Hash of the user's reflection
- `createdAt` (Date, auto) - Garden creation timestamp
- `updatedAt` (Date, auto) - Last update timestamp

**Indexes:**
- Unique compound index on `userId` + `walletAddress`

**Export:** `Garden` (with `IGarden` interface)

---

## XP Calculation

XP is calculated based on session duration and mode:

- **Base XP:** 10 points per minute
- **Mode Multipliers:**
  - Meditation: 1.5x
  - Focus: 1.2x
  - Breathwork: 1.3x
  - Calm: 1.0x
  - Gratitude: 1.1x

**Level Formula:** `level = floor(sqrt(totalXP / 100)) + 1`

This creates a smooth progression:
- Level 1: 0-99 XP
- Level 2: 100-399 XP
- Level 3: 400-899 XP
- Level 4: 900-1599 XP
- Level 5: 1600-2499 XP

See `/utils/xp.ts` for helper functions.

---

## Model Recompilation Prevention

All models use the pattern:

```typescript
export const ModelName = 
  mongoose.models.ModelName || mongoose.model('ModelName', schema);
```

This prevents model recompilation in Next.js development mode and API routes, which would otherwise cause errors.

---

## Testing

Model tests are located in `/__tests__/models/` and cover:
- Schema validation
- Default values
- Required fields
- Unique constraints
- Instance and static methods
- Timestamps
- Indexes

Integration tests in `/__tests__/integration/` test cross-model functionality.

Run tests with:
```bash
npm test
```
