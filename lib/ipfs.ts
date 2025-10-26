// IPFS upload utility using HTTP API directly (Next.js compatible)

export interface BadgeMetadata {
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
  reflectionHash?: string;
}

export interface EncryptedReflectionPayload {
  ciphertext: string;
  iv: string;
  salt: string;
  timestamp: string;
  mode: string;
  version: string;
}

export async function uploadMetadataToIPFS(
  metadata: BadgeMetadata
): Promise<string> {
  try {
    const ipfsHost = process.env.IPFS_HOST || 'localhost';
    const ipfsPort = process.env.IPFS_PORT || '5001';
    const ipfsProtocol = process.env.IPFS_PROTOCOL || 'http';
    
    const ipfsApiUrl = `${ipfsProtocol}://${ipfsHost}:${ipfsPort}/api/v0/add`;
    
    const metadataJSON = JSON.stringify(metadata, null, 2);
    const formData = new FormData();
    const blob = new Blob([metadataJSON], { type: 'application/json' });
    formData.append('file', blob, 'metadata.json');
    
    const response = await fetch(ipfsApiUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return result.Hash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
}

export async function uploadImageToIPFS(imageBuffer: Buffer): Promise<string> {
  try {
    const ipfsHost = process.env.IPFS_HOST || 'localhost';
    const ipfsPort = process.env.IPFS_PORT || '5001';
    const ipfsProtocol = process.env.IPFS_PROTOCOL || 'http';
    
    const ipfsApiUrl = `${ipfsProtocol}://${ipfsHost}:${ipfsPort}/api/v0/add`;
    
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(imageBuffer)]);
    formData.append('file', blob, 'image.png');
    
    const response = await fetch(ipfsApiUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return result.Hash;
  } catch (error) {
    console.error('Error uploading image to IPFS:', error);
    throw new Error('Failed to upload image to IPFS');
  }
}

export function getIPFSUrl(cid: string): string {
  const gateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs';
  return `${gateway}/${cid}`;
}

/**
 * Upload encrypted reflection payload to Web3.storage
 * @param payload - The encrypted reflection payload
 * @returns CID of the uploaded content
 */
export async function uploadEncryptedReflectionToIPFS(
  payload: EncryptedReflectionPayload
): Promise<string> {
  try {
    const web3StorageToken = process.env.WEB3_STORAGE_TOKEN;
    
    if (!web3StorageToken) {
      throw new Error('WEB3_STORAGE_TOKEN not configured');
    }
    
    const payloadJSON = JSON.stringify(payload, null, 2);
    const blob = new Blob([payloadJSON], { type: 'application/json' });
    const file = new File([blob], 'reflection.json', { type: 'application/json' });
    
    // Create FormData for Web3.storage upload
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${web3StorageToken}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Web3.storage upload failed: ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    // Web3.storage returns the CID in the response
    return result.cid;
  } catch (error) {
    console.error('Error uploading encrypted reflection to IPFS:', error);
    throw new Error('Failed to upload encrypted reflection to IPFS');
  }
}

/**
 * Upload any JSON data to Web3.storage
 * @param data - The JSON data to upload
 * @param filename - Optional filename
 * @returns CID of the uploaded content
 */
export async function uploadJSONToWeb3Storage(
  data: Record<string, any>,
  filename: string = 'data.json'
): Promise<string> {
  try {
    const web3StorageToken = process.env.WEB3_STORAGE_TOKEN;
    
    if (!web3StorageToken) {
      throw new Error('WEB3_STORAGE_TOKEN not configured');
    }
    
    const dataJSON = JSON.stringify(data, null, 2);
    const blob = new Blob([dataJSON], { type: 'application/json' });
    const file = new File([blob], filename, { type: 'application/json' });
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${web3StorageToken}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Web3.storage upload failed: ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    return result.cid;
  } catch (error) {
    console.error('Error uploading JSON to Web3.storage:', error);
    throw new Error('Failed to upload JSON to Web3.storage');
  }
}
