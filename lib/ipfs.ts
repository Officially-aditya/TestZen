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
