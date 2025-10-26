# Encryption and IPFS Implementation

## Overview

This document describes the implementation of client-side encryption for user reflections and their storage on IPFS via Web3.storage, integrated with the session completion flow.

## Features Implemented

### 1. Client-Side Encryption (`lib/encryption.ts`)

**AES-256-GCM Encryption**
- Uses Web Crypto API for secure client-side encryption
- Key derivation using PBKDF2 with 100,000 iterations
- Random salt and IV generation for each encryption
- Support for user-specific key derivation (using wallet address or user info)

**Key Functions:**
- `encryptText(plaintext, baseKey, userInfo?)`: Encrypts text and returns ciphertext, IV, and salt
- `decryptText(payload, baseKey, userInfo?)`: Decrypts encrypted payload back to plaintext
- `computeHash(text)`: Computes SHA-256 hash for integrity verification
- `generateBaseKey()`: Generates a secure random base key

**Security Features:**
- Each encryption produces unique ciphertext (random IV and salt)
- Keys are never exposed in encrypted payloads
- Base64 encoding for safe transport
- User-specific key derivation for added security

### 2. IPFS Integration (`lib/ipfs.ts`)

**Web3.storage Upload**
- `uploadEncryptedReflectionToIPFS(payload)`: Uploads encrypted reflection to Web3.storage
- `uploadJSONToWeb3Storage(data, filename?)`: Generic JSON upload to Web3.storage
- Returns Content Identifier (CID) for IPFS retrieval

**Encrypted Reflection Payload Structure:**
```typescript
{
  ciphertext: string;  // Base64 encoded encrypted content
  iv: string;          // Base64 encoded initialization vector
  salt: string;        // Base64 encoded salt for key derivation
  timestamp: string;   // ISO timestamp of encryption
  mode: string;        // Session mode (meditation, focus, breathwork)
  version: string;     // Version of encryption format
}
```

### 3. Session Model (`models/Session.ts`)

**MongoDB Schema:**
- Stores encrypted reflection data including:
  - `ciphertext`: The encrypted reflection text
  - `iv`: Initialization vector for decryption
  - `salt`: Salt used for key derivation
  - `hash`: SHA-256 hash of ciphertext for integrity verification
  - `cid`: IPFS CID where the encrypted reflection is stored

### 4. Session Completion API (`app/api/session/complete/route.ts`)

**POST /api/session/complete**

Accepts encrypted reflection data from client and:
1. Computes SHA-256 hash of ciphertext for integrity verification
2. Uploads encrypted payload to IPFS via Web3.storage
3. Stores session data with reflection CID and hash in MongoDB
4. Optionally submits HCS message with reflection hash

**Request Body:**
```typescript
{
  userId: string;
  walletAddress?: string;
  mode: string;
  duration: number;
  startTime: string;
  xpEarned: number;
  encryptedReflection?: {
    ciphertext: string;
    iv: string;
    salt: string;
  }
}
```

**Response:**
```typescript
{
  success: boolean;
  sessionId: string;
  reflectionCID?: string;
  reflectionHash?: string;
}
```

### 5. Session UI (`app/session/page.tsx`)

**Reflection Input Flow:**
1. User completes session timer
2. Presented with optional reflection textarea
3. Reflection is encrypted client-side using `encryptText()`
4. Encrypted payload sent to API (plaintext never leaves browser)
5. User continues to completion screen

**UI Features:**
- Optional reflection input
- Skip option if user doesn't want to add reflection
- Loading state while encrypting and submitting
- Clear messaging about encryption and IPFS storage

### 6. Hedera Consensus Service Integration (`lib/hedera.ts`)

**HCS Message Submission:**
- `submitHCSMessage(topicId, messageData)`: Submits session data to HCS topic
- Includes reflection hash and CID in message payload
- Messages are immutable and timestamped on Hedera network

**HCS Message Structure:**
```typescript
{
  sessionId: string;
  userId: string;
  mode: string;
  duration: number;
  xpEarned: number;
  reflectionHash?: string;  // SHA-256 hash of ciphertext
  reflectionCID?: string;   // IPFS CID
  timestamp: string;
}
```

## Environment Configuration

Add the following to `.env`:

```env
# Web3.storage Configuration
WEB3_STORAGE_TOKEN=your-web3-storage-api-token

# Encryption Configuration (Server-side only)
ENCRYPTION_BASE_KEY=your-base-encryption-key-generate-using-generateBaseKey

# Client-side Encryption (Optional - defaults will be used if not set)
NEXT_PUBLIC_ENCRYPTION_BASE_KEY=your-client-base-key

# Hedera HCS Topic (Optional)
HEDERA_HCS_TOPIC_ID=0.0.xxxxx
```

## Security Considerations

### What's Encrypted
- User reflection text is encrypted client-side before transmission
- Only encrypted ciphertext, IV, and salt are sent over the network
- Plaintext reflections never leave the user's browser

### What's Stored
- **Client (localStorage)**: Nothing sensitive (only XP, level, etc.)
- **Server (MongoDB)**: Encrypted reflection data, hash, CID
- **IPFS**: Encrypted reflection payload (publicly accessible but encrypted)
- **Hedera**: Hash of ciphertext and CID (no plaintext)

### Key Management
- Base encryption key stored server-side only (in environment variables)
- User-specific key derivation using wallet address or user ID
- Keys derived using PBKDF2 with 100,000 iterations
- Each encryption uses unique salt and IV

### Integrity Verification
- SHA-256 hash of ciphertext stored for verification
- Hash included in HCS messages for immutable proof
- Can verify reflection hasn't been tampered with

## Testing

Comprehensive test coverage includes:

### Unit Tests
- `__tests__/lib/encryption.test.ts`: Encryption/decryption, hashing, key generation
- `__tests__/lib/ipfs.test.ts`: IPFS upload with mocked Web3.storage
- `__tests__/lib/hedera-hcs.test.ts`: HCS message structure validation

### Integration Tests
- `__tests__/integration/encryption-ipfs-flow.test.ts`: Complete encryption → IPFS → decryption flow
- `__tests__/api/session/complete.test.ts`: API endpoint with encryption and IPFS

### API Tests
- Session completion with and without reflections
- Error handling for IPFS failures
- Data integrity verification

Run tests:
```bash
npm test                                              # Run all tests
npm test -- __tests__/lib/encryption.test.ts         # Encryption tests
npm test -- __tests__/integration                     # Integration tests
```

## Usage Example

### Client-Side Encryption
```typescript
import { encryptText } from '@/lib/encryption';

const reflection = "This meditation was very peaceful...";
const baseKey = process.env.NEXT_PUBLIC_ENCRYPTION_BASE_KEY;
const userWallet = "0x1234...";

const encrypted = await encryptText(reflection, baseKey, userWallet);
// encrypted = { ciphertext, iv, salt }
```

### API Call
```typescript
const response = await fetch('/api/session/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    walletAddress: user.wallet,
    mode: 'meditation',
    duration: 20,
    startTime: startTime.toISOString(),
    xpEarned: 200,
    encryptedReflection: {
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      salt: encrypted.salt,
    }
  })
});

const result = await response.json();
console.log('Reflection CID:', result.reflectionCID);
console.log('Reflection Hash:', result.reflectionHash);
```

### Decryption (if needed)
```typescript
import { decryptText } from '@/lib/encryption';

const decrypted = await decryptText(
  {
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    salt: encrypted.salt,
  },
  baseKey,
  userWallet
);
// decrypted = original plaintext
```

## Network Verification

Use browser DevTools Network inspector to verify:
1. ✅ No plaintext reflections in request payloads
2. ✅ Only base64-encoded encrypted data transmitted
3. ✅ POST to `/api/session/complete` contains `encryptedReflection` object
4. ✅ Response includes `reflectionCID` and `reflectionHash`

## IPFS Retrieval

Encrypted reflections can be retrieved from IPFS:
```
https://ipfs.io/ipfs/{CID}
```

Note: Retrieved content is still encrypted and requires decryption with the correct keys.

## Future Enhancements

Potential improvements:
- Client-side key generation from wallet signatures
- Encryption key rotation
- Batch IPFS uploads for multiple reflections
- Retrieval and decryption UI for viewing past reflections
- Public/private reflection toggle
- Reflection sharing with selective decryption keys

## References

- [Web Crypto API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Web3.storage Documentation](https://web3.storage/docs/)
- [Hedera Consensus Service](https://docs.hedera.com/guides/core-concepts/consensus-service)
- [AES-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
