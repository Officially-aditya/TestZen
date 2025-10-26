import {
  uploadEncryptedReflectionToIPFS,
  uploadJSONToWeb3Storage,
  EncryptedReflectionPayload,
} from '@/lib/ipfs';

// Mock fetch globally
global.fetch = jest.fn();

describe('IPFS Library - Web3.storage Integration', () => {
  const mockCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WEB3_STORAGE_TOKEN = 'test-web3-storage-token';
  });

  afterEach(() => {
    delete process.env.WEB3_STORAGE_TOKEN;
  });

  describe('uploadEncryptedReflectionToIPFS', () => {
    const mockPayload: EncryptedReflectionPayload = {
      ciphertext: 'encrypted-base64-string',
      iv: 'iv-base64-string',
      salt: 'salt-base64-string',
      timestamp: '2024-01-01T00:00:00.000Z',
      mode: 'meditation',
      version: '1.0',
    };

    it('should upload encrypted reflection and return CID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cid: mockCID }),
      });

      const cid = await uploadEncryptedReflectionToIPFS(mockPayload);

      expect(cid).toBe(mockCID);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.web3.storage/upload',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-web3-storage-token',
          }),
        })
      );
    });

    it('should throw error when WEB3_STORAGE_TOKEN is not configured', async () => {
      delete process.env.WEB3_STORAGE_TOKEN;

      await expect(uploadEncryptedReflectionToIPFS(mockPayload)).rejects.toThrow(
        'WEB3_STORAGE_TOKEN not configured'
      );
    });

    it('should throw error when upload fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        text: async () => 'Invalid token',
      });

      await expect(uploadEncryptedReflectionToIPFS(mockPayload)).rejects.toThrow(
        'Failed to upload encrypted reflection to IPFS'
      );
    });

    it('should include correct payload structure in upload', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cid: mockCID }),
      });

      await uploadEncryptedReflectionToIPFS(mockPayload);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const formData = callArgs[1].body as FormData;
      
      expect(formData).toBeInstanceOf(FormData);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(uploadEncryptedReflectionToIPFS(mockPayload)).rejects.toThrow(
        'Failed to upload encrypted reflection to IPFS'
      );
    });
  });

  describe('uploadJSONToWeb3Storage', () => {
    const mockData = {
      key1: 'value1',
      key2: 'value2',
      nested: {
        data: 'test',
      },
    };

    it('should upload JSON data and return CID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cid: mockCID }),
      });

      const cid = await uploadJSONToWeb3Storage(mockData, 'test.json');

      expect(cid).toBe(mockCID);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.web3.storage/upload',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-web3-storage-token',
          }),
        })
      );
    });

    it('should use default filename if not provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cid: mockCID }),
      });

      const cid = await uploadJSONToWeb3Storage(mockData);

      expect(cid).toBe(mockCID);
    });

    it('should throw error when WEB3_STORAGE_TOKEN is not configured', async () => {
      delete process.env.WEB3_STORAGE_TOKEN;

      await expect(uploadJSONToWeb3Storage(mockData)).rejects.toThrow(
        'WEB3_STORAGE_TOKEN not configured'
      );
    });

    it('should throw error when upload fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        text: async () => 'Invalid data',
      });

      await expect(uploadJSONToWeb3Storage(mockData)).rejects.toThrow(
        'Failed to upload JSON to Web3.storage'
      );
    });

    it('should handle complex nested JSON structures', async () => {
      const complexData = {
        array: [1, 2, 3],
        nested: {
          deep: {
            value: 'test',
          },
        },
        boolean: true,
        number: 42,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cid: mockCID }),
      });

      const cid = await uploadJSONToWeb3Storage(complexData);

      expect(cid).toBe(mockCID);
    });
  });

  describe('Integration with Encryption', () => {
    it('should upload encrypted payload structure correctly', async () => {
      const encryptedPayload: EncryptedReflectionPayload = {
        ciphertext: 'base64-encrypted-content',
        iv: 'base64-iv',
        salt: 'base64-salt',
        timestamp: new Date().toISOString(),
        mode: 'focus',
        version: '1.0',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cid: mockCID }),
      });

      const cid = await uploadEncryptedReflectionToIPFS(encryptedPayload);

      expect(cid).toBe(mockCID);
      
      // Verify the structure matches the expected format
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe('https://api.web3.storage/upload');
      expect(callArgs[1].method).toBe('POST');
    });
  });
});
