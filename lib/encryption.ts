// Client and Server-side encryption utilities using Web Crypto API (AES-256-GCM)

/**
 * Encryption result containing ciphertext, IV, and optional auth tag
 */
export interface EncryptionResult {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded
  authTag?: string; // Included in ciphertext for GCM mode
  salt: string; // Base64 encoded salt used for key derivation
}

/**
 * Decryption payload matching EncryptionResult structure
 */
export interface DecryptionPayload {
  ciphertext: string;
  iv: string;
  salt: string;
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a random salt for key derivation
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate a random IV for encryption
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
}

/**
 * Derive an encryption key from a base key and salt using PBKDF2
 */
async function deriveKey(
  baseKey: string,
  salt: Uint8Array,
  userInfo?: string
): Promise<CryptoKey> {
  // Combine base key with optional user info for key derivation
  const keyMaterial = baseKey + (userInfo || '');
  
  const encoder = new TextEncoder();
  const keyMaterialBuffer = encoder.encode(keyMaterial);
  
  // Import the key material
  const importedKey = await crypto.subtle.importKey(
    'raw',
    keyMaterialBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive a key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext using AES-256-GCM
 * @param plaintext - The text to encrypt
 * @param baseKey - Base encryption key (from environment)
 * @param userInfo - Optional user-specific info (e.g., wallet address) for key derivation
 * @returns EncryptionResult with ciphertext, IV, and salt
 */
export async function encryptText(
  plaintext: string,
  baseKey: string,
  userInfo?: string
): Promise<EncryptionResult> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random salt and IV
    const salt = generateSalt();
    const iv = generateIV();
    
    // Derive encryption key
    const key = await deriveKey(baseKey, salt, userInfo);
    
    // Encrypt the data
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );
    
    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(salt),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt text');
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param payload - The decryption payload containing ciphertext, IV, and salt
 * @param baseKey - Base encryption key (from environment)
 * @param userInfo - Optional user-specific info used during encryption
 * @returns Decrypted plaintext
 */
export async function decryptText(
  payload: DecryptionPayload,
  baseKey: string,
  userInfo?: string
): Promise<string> {
  try {
    // Convert from Base64
    const ciphertext = base64ToArrayBuffer(payload.ciphertext);
    const iv = base64ToArrayBuffer(payload.iv);
    const salt = base64ToArrayBuffer(payload.salt);
    
    // Derive the same encryption key
    const key = await deriveKey(baseKey, new Uint8Array(salt), userInfo);
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
      },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt text');
  }
}

/**
 * Compute SHA-256 hash of text (for integrity verification)
 * @param text - The text to hash
 * @returns Base64 encoded hash
 */
export async function computeHash(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return arrayBufferToBase64(hashBuffer);
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to compute hash');
  }
}

/**
 * Generate a secure random base key (for server-side use)
 * This should be called once and stored in environment variables
 */
export function generateBaseKey(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return arrayBufferToBase64(randomBytes);
}
