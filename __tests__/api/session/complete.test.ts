import { POST } from '@/app/api/session/complete/route';
import { NextRequest } from 'next/server';
import { SessionModel } from '@/models/Session';
import * as ipfsLib from '@/lib/ipfs';
import * as encryptionLib from '@/lib/encryption';
import dbConnect from '@/lib/mongodb';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/Session');
jest.mock('@/lib/ipfs');
jest.mock('@/lib/encryption');

describe('POST /api/session/complete', () => {
  const mockCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
  const mockHash = 'mock-sha256-hash-base64';
  
  beforeEach(() => {
    jest.clearAllMocks();
    (dbConnect as jest.Mock).mockResolvedValue(undefined);
    (encryptionLib.computeHash as jest.Mock).mockResolvedValue(mockHash);
    (ipfsLib.uploadEncryptedReflectionToIPFS as jest.Mock).mockResolvedValue(mockCID);
  });

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  describe('Valid Requests', () => {
    it('should complete session without reflection', async () => {
      const mockSessionId = 'mock-session-id-123';
      (SessionModel.create as jest.Mock).mockResolvedValue({
        _id: mockSessionId,
      });

      const requestBody = {
        userId: 'user-123',
        mode: 'meditation',
        duration: 10,
        startTime: new Date().toISOString(),
        xpEarned: 100,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe(mockSessionId);
      expect(data.reflectionCID).toBeUndefined();
      expect(data.reflectionHash).toBeUndefined();
      expect(SessionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          mode: 'meditation',
          duration: 10,
          xpEarned: 100,
          completed: true,
        })
      );
    });

    it('should complete session with encrypted reflection', async () => {
      const mockSessionId = 'mock-session-id-456';
      (SessionModel.create as jest.Mock).mockResolvedValue({
        _id: mockSessionId,
      });

      const requestBody = {
        userId: 'user-123',
        walletAddress: '0x1234567890',
        mode: 'focus',
        duration: 20,
        startTime: new Date().toISOString(),
        xpEarned: 200,
        encryptedReflection: {
          ciphertext: 'encrypted-base64-content',
          iv: 'iv-base64',
          salt: 'salt-base64',
        },
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe(mockSessionId);
      expect(data.reflectionCID).toBe(mockCID);
      expect(data.reflectionHash).toBe(mockHash);
      
      // Verify encryption hash was computed
      expect(encryptionLib.computeHash).toHaveBeenCalledWith('encrypted-base64-content');
      
      // Verify IPFS upload was called
      expect(ipfsLib.uploadEncryptedReflectionToIPFS).toHaveBeenCalledWith(
        expect.objectContaining({
          ciphertext: 'encrypted-base64-content',
          iv: 'iv-base64',
          salt: 'salt-base64',
          mode: 'focus',
          version: '1.0',
        })
      );
      
      // Verify session was created with reflection data
      expect(SessionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          encryptedReflection: {
            ciphertext: 'encrypted-base64-content',
            iv: 'iv-base64',
            salt: 'salt-base64',
            hash: mockHash,
            cid: mockCID,
          },
        })
      );
    });

    it('should handle IPFS upload failure gracefully', async () => {
      const mockSessionId = 'mock-session-id-789';
      (SessionModel.create as jest.Mock).mockResolvedValue({
        _id: mockSessionId,
      });
      (ipfsLib.uploadEncryptedReflectionToIPFS as jest.Mock).mockRejectedValue(
        new Error('IPFS upload failed')
      );

      const requestBody = {
        userId: 'user-123',
        mode: 'breathwork',
        duration: 15,
        startTime: new Date().toISOString(),
        xpEarned: 150,
        encryptedReflection: {
          ciphertext: 'encrypted-content',
          iv: 'iv',
          salt: 'salt',
        },
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Should still succeed but without CID
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe(mockSessionId);
      expect(data.reflectionCID).toBeUndefined();
      expect(data.reflectionHash).toBe(mockHash);
      
      // Verify session was created with reflection but without CID
      expect(SessionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          encryptedReflection: {
            ciphertext: 'encrypted-content',
            iv: 'iv',
            salt: 'salt',
            hash: mockHash,
          },
        })
      );
    });
  });

  describe('Invalid Requests', () => {
    it('should return 400 for missing userId', async () => {
      const requestBody = {
        mode: 'meditation',
        duration: 10,
        startTime: new Date().toISOString(),
        xpEarned: 100,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Missing required fields');
      expect(SessionModel.create).not.toHaveBeenCalled();
    });

    it('should return 400 for missing mode', async () => {
      const requestBody = {
        userId: 'user-123',
        duration: 10,
        startTime: new Date().toISOString(),
        xpEarned: 100,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Missing required fields');
    });

    it('should return 400 for missing duration', async () => {
      const requestBody = {
        userId: 'user-123',
        mode: 'meditation',
        startTime: new Date().toISOString(),
        xpEarned: 100,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Missing required fields');
    });

    it('should return 400 for missing xpEarned', async () => {
      const requestBody = {
        userId: 'user-123',
        mode: 'meditation',
        duration: 10,
        startTime: new Date().toISOString(),
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Missing required fields');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when database operation fails', async () => {
      (SessionModel.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const requestBody = {
        userId: 'user-123',
        mode: 'meditation',
        duration: 10,
        startTime: new Date().toISOString(),
        xpEarned: 100,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Database error');
    });

    it('should return 500 when hash computation fails', async () => {
      (encryptionLib.computeHash as jest.Mock).mockRejectedValue(
        new Error('Hash computation failed')
      );

      const requestBody = {
        userId: 'user-123',
        mode: 'meditation',
        duration: 10,
        startTime: new Date().toISOString(),
        xpEarned: 100,
        encryptedReflection: {
          ciphertext: 'encrypted-content',
          iv: 'iv',
          salt: 'salt',
        },
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Data Integrity', () => {
    it('should store complete reflection data including hash and CID', async () => {
      const mockSessionId = 'integrity-test-id';
      (SessionModel.create as jest.Mock).mockResolvedValue({
        _id: mockSessionId,
      });

      const requestBody = {
        userId: 'user-123',
        walletAddress: '0xABC',
        mode: 'meditation',
        duration: 30,
        startTime: new Date().toISOString(),
        xpEarned: 300,
        encryptedReflection: {
          ciphertext: 'test-ciphertext',
          iv: 'test-iv',
          salt: 'test-salt',
        },
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      await response.json();

      const createCall = (SessionModel.create as jest.Mock).mock.calls[0][0];
      expect(createCall.encryptedReflection).toEqual({
        ciphertext: 'test-ciphertext',
        iv: 'test-iv',
        salt: 'test-salt',
        hash: mockHash,
        cid: mockCID,
      });
    });

    it('should include timestamp and version in IPFS payload', async () => {
      (SessionModel.create as jest.Mock).mockResolvedValue({
        _id: 'test-id',
      });

      const requestBody = {
        userId: 'user-123',
        mode: 'focus',
        duration: 25,
        startTime: new Date().toISOString(),
        xpEarned: 250,
        encryptedReflection: {
          ciphertext: 'ciphertext',
          iv: 'iv',
          salt: 'salt',
        },
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      const uploadCall = (ipfsLib.uploadEncryptedReflectionToIPFS as jest.Mock).mock.calls[0][0];
      expect(uploadCall).toHaveProperty('timestamp');
      expect(uploadCall).toHaveProperty('version', '1.0');
      expect(uploadCall).toHaveProperty('mode', 'focus');
    });
  });
});
