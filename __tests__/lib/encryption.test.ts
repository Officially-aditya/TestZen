import {
  encryptText,
  decryptText,
  computeHash,
  generateBaseKey,
} from '@/lib/encryption';

// Mock crypto for Node.js environment
import { webcrypto } from 'crypto';
global.crypto = webcrypto as any;

describe('Encryption Library', () => {
  const baseKey = 'test-base-key-for-testing-purposes';
  const userInfo = 'test-user-wallet-address';
  const plaintext = 'This is a test reflection about my meditation session.';

  describe('encryptText', () => {
    it('should encrypt plaintext and return ciphertext, IV, and salt', async () => {
      const result = await encryptText(plaintext, baseKey, userInfo);

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('salt');
      expect(typeof result.ciphertext).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(typeof result.salt).toBe('string');
      expect(result.ciphertext.length).toBeGreaterThan(0);
      expect(result.iv.length).toBeGreaterThan(0);
      expect(result.salt.length).toBeGreaterThan(0);
    });

    it('should produce different ciphertext for same plaintext (due to random IV and salt)', async () => {
      const result1 = await encryptText(plaintext, baseKey, userInfo);
      const result2 = await encryptText(plaintext, baseKey, userInfo);

      expect(result1.ciphertext).not.toBe(result2.ciphertext);
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.salt).not.toBe(result2.salt);
    });

    it('should handle empty string', async () => {
      const result = await encryptText('', baseKey, userInfo);

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('salt');
    });

    it('should handle long text', async () => {
      const longText = 'a'.repeat(10000);
      const result = await encryptText(longText, baseKey, userInfo);

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('salt');
    });

    it('should work without userInfo', async () => {
      const result = await encryptText(plaintext, baseKey);

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('salt');
    });
  });

  describe('decryptText', () => {
    it('should decrypt ciphertext back to original plaintext', async () => {
      const encrypted = await encryptText(plaintext, baseKey, userInfo);
      const decrypted = await decryptText(
        {
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
        },
        baseKey,
        userInfo
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string decryption', async () => {
      const encrypted = await encryptText('', baseKey, userInfo);
      const decrypted = await decryptText(
        {
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
        },
        baseKey,
        userInfo
      );

      expect(decrypted).toBe('');
    });

    it('should handle long text decryption', async () => {
      const longText = 'b'.repeat(10000);
      const encrypted = await encryptText(longText, baseKey, userInfo);
      const decrypted = await decryptText(
        {
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
        },
        baseKey,
        userInfo
      );

      expect(decrypted).toBe(longText);
    });

    it('should fail with wrong base key', async () => {
      const encrypted = await encryptText(plaintext, baseKey, userInfo);

      await expect(
        decryptText(
          {
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            salt: encrypted.salt,
          },
          'wrong-key',
          userInfo
        )
      ).rejects.toThrow();
    });

    it('should fail with wrong userInfo', async () => {
      const encrypted = await encryptText(plaintext, baseKey, userInfo);

      await expect(
        decryptText(
          {
            ciphertext: encrypted.ciphertext,
            iv: encrypted.iv,
            salt: encrypted.salt,
          },
          baseKey,
          'wrong-user-info'
        )
      ).rejects.toThrow();
    });

    it('should fail with corrupted ciphertext', async () => {
      const encrypted = await encryptText(plaintext, baseKey, userInfo);

      await expect(
        decryptText(
          {
            ciphertext: 'corrupted-ciphertext',
            iv: encrypted.iv,
            salt: encrypted.salt,
          },
          baseKey,
          userInfo
        )
      ).rejects.toThrow();
    });

    it('should work without userInfo if encrypted without it', async () => {
      const encrypted = await encryptText(plaintext, baseKey);
      const decrypted = await decryptText(
        {
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
        },
        baseKey
      );

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('computeHash', () => {
    it('should compute SHA-256 hash of text', async () => {
      const hash = await computeHash(plaintext);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce consistent hash for same input', async () => {
      const hash1 = await computeHash(plaintext);
      const hash2 = await computeHash(plaintext);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different input', async () => {
      const hash1 = await computeHash('text1');
      const hash2 = await computeHash('text2');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', async () => {
      const hash = await computeHash('');

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle long text', async () => {
      const longText = 'c'.repeat(10000);
      const hash = await computeHash(longText);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('generateBaseKey', () => {
    it('should generate a base key', () => {
      const key = generateBaseKey();

      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('should generate different keys each time', () => {
      const key1 = generateBaseKey();
      const key2 = generateBaseKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('End-to-End Encryption Flow', () => {
    it('should encrypt and decrypt successfully', async () => {
      const originalText = 'This is my private reflection that should be encrypted.';
      
      // Encrypt
      const encrypted = await encryptText(originalText, baseKey, userInfo);
      
      // Verify ciphertext is different from plaintext
      expect(encrypted.ciphertext).not.toContain(originalText);
      
      // Compute hash
      const hash = await computeHash(encrypted.ciphertext);
      expect(hash).toBeTruthy();
      
      // Decrypt
      const decrypted = await decryptText(
        {
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          salt: encrypted.salt,
        },
        baseKey,
        userInfo
      );
      
      // Verify decryption
      expect(decrypted).toBe(originalText);
    });

    it('should ensure plaintext is not visible in encrypted output', async () => {
      const secretText = 'MySecretPassword123!';
      const encrypted = await encryptText(secretText, baseKey, userInfo);

      // Check that the secret is not visible in any of the outputs
      expect(encrypted.ciphertext).not.toContain(secretText);
      expect(encrypted.iv).not.toContain(secretText);
      expect(encrypted.salt).not.toContain(secretText);
    });
  });
});
