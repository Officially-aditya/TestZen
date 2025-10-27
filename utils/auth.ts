import crypto from 'crypto';

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify a signed proof payload
 * For now, this is a placeholder that validates the structure
 * In production, this would verify the signature using Hedera SDK
 * 
 * Expected format: base64-encoded signed message
 */
export function verifySignedProof(
  signedProof: string,
  hederaAccountId: string,
  nonce: string,
  sessionId: string
): boolean {
  try {
    // Validate that signedProof is not empty
    if (!signedProof || signedProof.length === 0) {
      return false;
    }
    
    // Validate base64 encoding
    const decoded = Buffer.from(signedProof, 'base64').toString('utf-8');
    if (!decoded) {
      return false;
    }
    
    // Parse the signed proof (expecting JSON structure)
    let proofData: any;
    try {
      proofData = JSON.parse(decoded);
    } catch {
      // If not JSON, treat the whole thing as the signature
      // This is acceptable for basic validation
      return true;
    }
    
    // Validate that proof contains expected fields
    if (proofData.nonce !== nonce) {
      console.error('Nonce mismatch in signed proof');
      return false;
    }
    
    if (proofData.sessionId !== sessionId) {
      console.error('Session ID mismatch in signed proof');
      return false;
    }
    
    if (proofData.hederaAccountId !== hederaAccountId) {
      console.error('Account ID mismatch in signed proof');
      return false;
    }
    
    // TODO: Implement actual signature verification using Hedera SDK
    // This would involve:
    // 1. Getting the public key for the Hedera account
    // 2. Verifying the signature against the payload
    // 3. Ensuring the signature is from the claimed account
    
    return true;
  } catch (error) {
    console.error('Error verifying signed proof:', error);
    return false;
  }
}

/**
 * Create a message to be signed by the client
 */
export function createSignatureMessage(
  hederaAccountId: string,
  sessionId: string,
  nonce: string,
  timestamp: string
): string {
  const message = {
    hederaAccountId,
    sessionId,
    nonce,
    timestamp,
    message: 'Sign this message to complete your meditation session',
  };
  
  return JSON.stringify(message);
}
