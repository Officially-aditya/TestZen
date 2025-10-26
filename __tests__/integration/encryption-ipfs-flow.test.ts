/**
 * Integration test for encryption and IPFS upload flow
 * Verifies end-to-end encryption, IPFS upload, and data integrity
 */

import { encryptText, decryptText, computeHash } from '@/lib/encryption';
import { uploadEncryptedReflectionToIPFS, EncryptedReflectionPayload } from '@/lib/ipfs';

// Mock crypto for Node.js environment
import { webcrypto } from 'crypto';
global.crypto = webcrypto as any;

// Mock fetch for IPFS upload
global.fetch = jest.fn();

describe('Encryption and IPFS Integration Flow', () => {
  const baseKey = 'integration-test-base-key';
  const userInfo = 'test-wallet-address-0x123';
  const mockCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WEB3_STORAGE_TOKEN = 'test-token';
  });

  afterEach(() => {
    delete process.env.WEB3_STORAGE_TOKEN;
  });

  describe('Complete Reflection Encryption and Storage Flow', () => {
    it('should encrypt reflection, upload to IPFS, and verify integrity', async () => {
      const originalReflection = 'This meditation session was very calming. I felt a deep sense of peace and clarity.';

      // Step 1: Encrypt the reflection
      const encrypted = await encryptText(originalReflection, baseKey, userInfo);

      // Verify encryption output
      expect(encrypted.ciphertext).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.salt).toBeTruthy();
      expect(encrypted.ciphertext).not.toContain(originalReflection);

      // Step 2: Compute hash of ciphertext
      const hash = await computeHash(encrypted.ciphertext);
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');

      // Step 3: Prepare payload for IPFS
      const ipfsPayload: EncryptedReflectionPayload = {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt,
        timestamp: new Date().toISOString(),
        mode: 'meditation',
        version: '1.0',
      };

      // Mock IPFS upload
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cid: mockCID }),
      });

      // Step 4: Upload to IPFS
      const cid = await uploadEncryptedReflectionToIPFS(ipfsPayload);
      expect(cid).toBe(mockCID);

      // Step 5: Verify decryption works
      const decrypted = await decryptText(
        {
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
        },
        baseKey,
        userInfo
      );

      expect(decrypted).toBe(originalReflection);
    });

    it('should verify hash consistency before and after IPFS upload', async () => {
      const reflection = 'Another peaceful session focused on breath awareness.';

      // Encrypt
      const encrypted = await encryptText(reflection, baseKey, userInfo);

      // Compute hash before upload
      const hashBefore = await computeHash(encrypted.ciphertext);

      // Mock upload
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cid: mockCID }),
      });

      // Upload to IPFS
      const payload: EncryptedReflectionPayload = {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt,
        timestamp: new Date().toISOString(),
        mode: 'focus',
        version: '1.0',
      };

      await uploadEncryptedReflectionToIPFS(payload);

      // Compute hash after upload (should be same)
      const hashAfter = await computeHash(encrypted.ciphertext);

      expect(hashBefore).toBe(hashAfter);
    });

    it('should ensure plaintext never appears in network traffic', async () => {
      const secretReflection = 'My secret thoughts: password123';

      // Encrypt
      const encrypted = await encryptText(secretReflection, baseKey, userInfo);

      // Prepare IPFS payload
      const payload: EncryptedReflectionPayload = {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt,
        timestamp: new Date().toISOString(),
        mode: 'breathwork',
        version: '1.0',
      };

      // Mock upload
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cid: mockCID }),
      });

      await uploadEncryptedReflectionToIPFS(payload);

      // Verify plaintext is not in any of the data
      const payloadJSON = JSON.stringify(payload);
      expect(payloadJSON).not.toContain(secretReflection);
      expect(payloadJSON).not.toContain('password123');
      expect(encrypted.ciphertext).not.toContain(secretReflection);
    });

    it('should handle multiple reflections with different encryption keys', async () => {
      const reflection1 = 'First user reflection';
      const reflection2 = 'Second user reflection';
      const userInfo1 = 'user1-wallet';
      const userInfo2 = 'user2-wallet';

      // Encrypt both
      const encrypted1 = await encryptText(reflection1, baseKey, userInfo1);
      const encrypted2 = await encryptText(reflection2, baseKey, userInfo2);

      // Should produce different ciphertexts
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);

      // Each should decrypt to its original
      const decrypted1 = await decryptText(
        {
          ciphertext: encrypted1.ciphertext,
          iv: encrypted1.iv,
          salt: encrypted1.salt,
        },
        baseKey,
        userInfo1
      );

      const decrypted2 = await decryptText(
        {
          ciphertext: encrypted2.ciphertext,
          iv: encrypted2.iv,
          salt: encrypted2.salt,
        },
        baseKey,
        userInfo2
      );

      expect(decrypted1).toBe(reflection1);
      expect(decrypted2).toBe(reflection2);

      // Cross-decryption should fail
      await expect(
        decryptText(
          {
            ciphertext: encrypted1.ciphertext,
            iv: encrypted1.iv,
            salt: encrypted1.salt,
          },
          baseKey,
          userInfo2 // Wrong user info
        )
      ).rejects.toThrow();
    });

    it('should maintain data integrity through complete flow', async () => {
      const originalData = {
        reflection: 'A long reflection about my meditation practice...',
        sessionInfo: {
          duration: 20,
          mode: 'meditation',
        },
      };

      const reflectionText = JSON.stringify(originalData);

      // Complete flow
      const encrypted = await encryptText(reflectionText, baseKey, userInfo);
      const hash = await computeHash(encrypted.ciphertext);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cid: mockCID }),
      });

      const payload: EncryptedReflectionPayload = {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt,
        timestamp: new Date().toISOString(),
        mode: 'meditation',
        version: '1.0',
      };

      const cid = await uploadEncryptedReflectionToIPFS(payload);

      // Decrypt and verify
      const decrypted = await decryptText(
        {
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
        },
        baseKey,
        userInfo
      );

      // Verify hash again
      const verifyHash = await computeHash(encrypted.ciphertext);

      expect(decrypted).toBe(reflectionText);
      expect(verifyHash).toBe(hash);
      expect(cid).toBe(mockCID);

      // Parse and verify JSON structure
      const parsedData = JSON.parse(decrypted);
      expect(parsedData.reflection).toBe(originalData.reflection);
      expect(parsedData.sessionInfo.duration).toBe(originalData.sessionInfo.duration);
    });
  });

  describe('Security Verifications', () => {
    it('should not expose encryption keys in payload', async () => {
      const reflection = 'Test reflection';
      const encrypted = await encryptText(reflection, baseKey, userInfo);

      const payload: EncryptedReflectionPayload = {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt,
        timestamp: new Date().toISOString(),
        mode: 'meditation',
        version: '1.0',
      };

      const payloadString = JSON.stringify(payload);

      // Keys should not be in payload
      expect(payloadString).not.toContain(baseKey);
      expect(payloadString).not.toContain('base-key');
    });

    it('should use different IVs for each encryption', async () => {
      const reflection = 'Same reflection';

      const encrypted1 = await encryptText(reflection, baseKey, userInfo);
      const encrypted2 = await encryptText(reflection, baseKey, userInfo);

      // Different IVs
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // Different salts
      expect(encrypted1.salt).not.toBe(encrypted2.salt);

      // Different ciphertexts (due to different IVs)
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);

      // But both decrypt to same plaintext
      const decrypted1 = await decryptText(
        {
          ciphertext: encrypted1.ciphertext,
          iv: encrypted1.iv,
          salt: encrypted1.salt,
        },
        baseKey,
        userInfo
      );

      const decrypted2 = await decryptText(
        {
          ciphertext: encrypted2.ciphertext,
          iv: encrypted2.iv,
          salt: encrypted2.salt,
        },
        baseKey,
        userInfo
      );

      expect(decrypted1).toBe(reflection);
      expect(decrypted2).toBe(reflection);
    });
  });

  describe('Error Handling in Complete Flow', () => {
    it('should handle IPFS upload failure after successful encryption', async () => {
      const reflection = 'Test reflection';
      const encrypted = await encryptText(reflection, baseKey, userInfo);

      const payload: EncryptedReflectionPayload = {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt,
        timestamp: new Date().toISOString(),
        mode: 'meditation',
        version: '1.0',
      };

      // Mock IPFS failure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error',
        text: async () => 'Upload failed',
      });

      await expect(uploadEncryptedReflectionToIPFS(payload)).rejects.toThrow();

      // But decryption should still work
      const decrypted = await decryptText(
        {
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
        },
        baseKey,
        userInfo
      );

      expect(decrypted).toBe(reflection);
    });

    it('should verify hash can detect tampering', async () => {
      const reflection = 'Original reflection';
      const encrypted = await encryptText(reflection, baseKey, userInfo);
      const originalHash = await computeHash(encrypted.ciphertext);

      // Tamper with ciphertext
      const tamperedCiphertext = encrypted.ciphertext + 'X';
      const tamperedHash = await computeHash(tamperedCiphertext);

      // Hashes should be different
      expect(tamperedHash).not.toBe(originalHash);

      // Decryption should fail
      await expect(
        decryptText(
          {
            ciphertext: tamperedCiphertext,
            iv: encrypted.iv,
            salt: encrypted.salt,
          },
          baseKey,
          userInfo
        )
      ).rejects.toThrow();
    });
  });
});
