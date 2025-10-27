# Mongo Models Implementation Summary

## Overview
This document summarizes the implementation of MongoDB models for users, sessions, gardens, and XP logic.

## Models Implemented

### 1. User Model (`models/User.ts`)
**Status:** ✅ Complete

**Key Features:**
- Unique Hedera account ID with index
- XP tracking with level progression
- Session statistics (total sessions, total minutes)
- Timestamps for creation and last session

**Instance Methods:**
- `calculateCurrentLevel()` - Calculate current level from total XP
- `getNextLevelXP()` - Get XP required for next level
- `getLevelProgress()` - Get detailed level progress information

**Static Methods:**
- `findByHederaAccount(hederaAccountId)` - Find user by Hedera account ID

**Export Pattern:** Uses `mongoose.models.User || mongoose.model()` pattern to prevent recompilation

---

### 2. Session Model (`models/Session.ts`)
**Status:** ✅ Complete

**Key Features:**
- References user by ID and Hedera account
- Session mode enum: 'meditation', 'focus', 'breathwork', 'calm', 'gratitude'
- Duration tracking in minutes
- XP earned per session
- Unique nonce for replay attack prevention
- HCS (Hedera Consensus Service) metadata fields
- Encrypted reflection with IPFS CID support
- Compound indexes for efficient queries

**HCS Integration:**
- `hcsTopicId` - Hedera topic ID
- `hcsSequenceNumber` - Message sequence number
- `hcsConsensusTimestamp` - Consensus timestamp
- `signedProof` - Signed proof payload

**Encrypted Reflection:**
- `ciphertext` - Encrypted reflection text
- `iv` - Initialization vector
- `salt` - Encryption salt
- `hash` - SHA-256 hash for integrity
- `cid` - IPFS CID (optional)

**Export Pattern:** Exported as `SessionModel` to avoid naming conflicts

---

### 3. Garden Model (`models/Garden.ts`)
**Status:** ✅ Complete

**Key Features:**
- 3×3 grid of tiles (9 total)
- User reference with unique compound index (userId + walletAddress)
- Tile completion tracking with session type and timestamp
- NFT minting status and metadata

**Tile Structure:**
- `id` - Tile ID (0-8)
- `completed` - Boolean completion status
- `sessionType` - Type of session that completed the tile
- `completedAt` - Timestamp of completion

**NFT Metadata:**
- `tokenId` - Hedera token ID
- `serialNumber` - NFT serial number
- `cid` - IPFS CID of metadata
- `transactionId` - Hedera transaction ID
- `mintedAt` - Minting timestamp
- `level` - User level at completion
- `totalXP` - User XP at completion
- `completionDate` - Garden completion date
- `reflectionHash` - Optional reflection hash

---

## XP System Implementation

### XP Calculation (`utils/xp.ts`)
**Status:** ✅ Complete

**Functions:**
- `calculateXP(duration, mode)` - Calculate XP earned for a session
- `calculateLevel(totalXP)` - Calculate level from total XP
- `getXPForNextLevel(currentLevel)` - Get XP threshold for next level
- `getXPProgress(totalXP, currentLevel)` - Get progress toward next level
- `updateUserXP(currentXP, currentLevel, xpToAdd)` - Update user XP and check for level up

**XP Formula:**
- Base: 10 XP per minute
- Multipliers:
  - Meditation: 1.5x
  - Focus: 1.2x
  - Breathwork: 1.3x
  - Calm: 1.0x
  - Gratitude: 1.1x

**Level Formula:**
```
level = floor(sqrt(totalXP / 100)) + 1
```

**Level Thresholds:**
- Level 1: 0-99 XP
- Level 2: 100-399 XP
- Level 3: 400-899 XP
- Level 4: 900-1599 XP
- Level 5: 1600-2499 XP
- (continues with increasing thresholds)

---

## Garden Utilities (`utils/garden.ts`)
**Status:** ✅ Complete (already existed)

**Functions:**
- `initializeGarden()` - Create initial 9-tile garden
- `updateGardenProgression(tiles, sessionType)` - Mark next tile as complete
- `getGardenPreview(garden)` - Get garden status summary
- `isGardenReadyForNFT(garden)` - Check if garden is ready for minting

---

## Tests Implemented

### Unit Tests

#### 1. XP Utilities Test (`__tests__/utils/xp.test.ts`)
**Status:** ✅ Enhanced with new tests

**Test Coverage:**
- ✅ XP calculation for all session modes
- ✅ Level calculation for various XP ranges
- ✅ Next level XP thresholds
- ✅ Level progress calculations
- ✅ **NEW:** User XP update with level-up detection

#### 2. Garden Utilities Test (`__tests__/utils/garden.test.ts`)
**Status:** ✅ Complete (already existed)

**Test Coverage:**
- ✅ Garden initialization
- ✅ Garden progression updates
- ✅ Grid completion detection
- ✅ Garden preview generation
- ✅ NFT readiness checks

### Model Tests

#### 3. User Model Test (`__tests__/models/User.test.ts`)
**Status:** ✅ New

**Test Coverage:**
- ✅ Schema validation and required fields
- ✅ Default values application
- ✅ Unique constraint on Hedera account ID
- ✅ Optional fields (lastSessionAt)
- ✅ Instance methods (level calculation, progress tracking)
- ✅ Static methods (findByHederaAccount)
- ✅ Timestamp auto-generation and updates

#### 4. Session Model Test (`__tests__/models/Session.test.ts`)
**Status:** ✅ New

**Test Coverage:**
- ✅ Schema validation for all fields
- ✅ Session mode enum validation (all 5 modes)
- ✅ Required fields enforcement
- ✅ Unique nonce constraint
- ✅ HCS metadata storage
- ✅ Encrypted reflection with CID
- ✅ Optional fields handling
- ✅ Compound indexes verification
- ✅ Timestamp management

#### 5. Garden Model Test (`__tests__/models/Garden.test.ts`)
**Status:** ✅ New

**Test Coverage:**
- ✅ Schema validation
- ✅ 3×3 grid structure
- ✅ Tile completion with metadata
- ✅ Tile updates in existing gardens
- ✅ NFT metadata storage
- ✅ Unique compound index (userId + walletAddress)
- ✅ Query patterns (by user, by wallet, by mint status)
- ✅ Progressive garden completion scenarios

### Integration Tests

#### 6. Models Integration Test (`__tests__/integration/models-integration.test.ts`)
**Status:** ✅ New

**Test Coverage:**
- ✅ Complete user journey (user creation, garden creation)
- ✅ Session completion with XP updates and level progression
- ✅ Garden progression after session completion
- ✅ Complete 9-tile garden flow with NFT metadata
- ✅ User instance methods integration
- ✅ User static methods integration
- ✅ XP calculation for all session modes
- ✅ Referential integrity between models
- ✅ Multiple sessions per user

---

## Documentation

### Model README (`models/README.md`)
**Status:** ✅ New

**Contents:**
- Detailed model field documentation
- Instance and static method descriptions
- XP system explanation
- Level progression formula
- Model recompilation prevention pattern
- Testing information

---

## Acceptance Criteria Verification

### ✅ Importing models in API routes works without recompilation warnings
- All models use the pattern: `mongoose.models.X || mongoose.model()`
- Verified in existing API routes (`app/api/session/start/route.ts`, etc.)

### ✅ Creating sample documents enforces schema constraints and timestamps
- Comprehensive model tests verify:
  - Required fields throw errors when missing
  - Unique constraints prevent duplicates
  - Default values are applied correctly
  - Timestamps (createdAt, updatedAt) are auto-generated
  - Optional fields are handled properly

### ✅ XP helper returns expected values and updates levels
- XP calculation tests verify correct multipliers for all modes:
  - Meditation: 1.5x ✅
  - Focus: 1.2x ✅
  - Breathwork: 1.3x ✅
  - Calm: 1.0x ✅
  - Gratitude: 1.1x ✅
- Level calculation follows the defined formula ✅
- `updateUserXP` function correctly:
  - Adds XP to total ✅
  - Calculates new level ✅
  - Detects level-ups ✅
  - Handles multiple level increases ✅

---

## Key Design Decisions

1. **Session Model Export Name:** Exported as `SessionModel` instead of `Session` to avoid conflicts with native Session objects

2. **Type Safety:** All models include TypeScript interfaces extending Mongoose Document for full type safety

3. **Model Methods:** User model includes both instance methods (for individual user operations) and static methods (for queries)

4. **Index Strategy:** Strategic indexes on frequently queried fields:
   - User: hederaAccountId (unique)
   - Session: userId, hederaAccountId, walletAddress, compound (userId + completed)
   - Garden: compound unique (userId + walletAddress)

5. **Flexibility:** Optional fields allow for progressive feature implementation (HCS metadata, encrypted reflections, NFT data)

6. **XP System:** Square root-based level progression creates balanced, gradually increasing level thresholds

---

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm test:coverage

# Run tests in watch mode
npm test:watch

# Type checking
npm run type-check
```

---

## Next Steps

With the models fully implemented and tested, the following can now be built:

1. ✅ User authentication and session management
2. ✅ Session start/complete API endpoints
3. ✅ Garden state tracking and updates
4. NFT minting when gardens are completed
5. User dashboard with XP/level visualization
6. Session history and analytics

---

## Dependencies

- `mongoose`: ^8.19.2
- `@hashgraph/sdk`: ^2.75.0 (for Hedera integration)
- `jest`: ^30.2.0 (for testing)
- `typescript`: ^5.3.3

---

## Notes

- All tests use a separate test database (`testzen-test`) to avoid conflicts
- MongoDB connection is required for model tests to run
- Integration tests verify cross-model functionality and real-world usage patterns
- Models are designed to support both development and production environments
