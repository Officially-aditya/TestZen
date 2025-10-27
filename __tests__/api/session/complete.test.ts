import { POST } from '@/app/api/session/complete/route';
import { NextRequest } from 'next/server';
import { SessionModel } from '@/models/Session';
import { User } from '@/models/User';
import { Garden } from '@/models/Garden';
import * as ipfsLib from '@/lib/ipfs';
import * as encryptionLib from '@/lib/encryption';
import * as hederaLib from '@/lib/hedera';
import dbConnect from '@/lib/mongodb';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/Session');
jest.mock('@/models/User');
jest.mock('@/models/Garden');
jest.mock('@/lib/ipfs');
jest.mock('@/lib/encryption');
jest.mock('@/lib/hedera');
jest.mock('@/utils/auth');

describe('POST /api/session/complete', () => {
  const mockCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
  const mockHash = 'mock-sha256-hash-base64';
  const mockSessionId = 'mock-session-id-123';
  const mockUserId = 'mock-user-id-456';
  const mockHederaAccountId = '0.0.12345';
  const mockNonce = 'mock-nonce-abc123';

  beforeEach(() => {
    jest.clearAllMocks();
    (dbConnect as jest.Mock).mockResolvedValue(undefined);
    (encryptionLib.computeHash as jest.Mock).mockResolvedValue(mockHash);
    (ipfsLib.uploadEncryptedReflectionToIPFS as jest.Mock).mockResolvedValue(mockCID);
    
    // Mock auth verification
    const authModule = require('@/utils/auth');
    authModule.verifySignedProof = jest.fn().mockReturnValue(true);

    // Set environment variable for HCS
    process.env.HEDERA_HCS_TOPIC_ID = '0.0.9999';
  });

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  const createMockSession = (overrides = {}) => ({
    _id: mockSessionId,
    userId: mockUserId,
    hederaAccountId: mockHederaAccountId,
    mode: 'meditation',
    duration: 10,
    startTime: new Date(),
    completed: false,
    xpEarned: 0,
    nonce: mockNonce,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  const createMockUser = (overrides = {}) => ({
    _id: mockUserId,
    hederaAccountId: mockHederaAccountId,
    totalXP: 100,
    level: 2,
    sessionsCompleted: 5,
    totalMinutes: 50,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  const createMockGarden = (overrides = {}) => ({
    _id: 'garden-id',
    userId: mockUserId,
    walletAddress: mockHederaAccountId,
    tiles: Array.from({ length: 9 }, (_, i) => ({
      id: i,
      completed: i < 3,
      sessionType: i < 3 ? 'meditation' : undefined,
      completedAt: i < 3 ? new Date() : undefined,
    })),
    nftMinted: false,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  describe('Valid Requests - Happy Path', () => {
    it('should complete session with all data updates', async () => {
      const mockSession = createMockSession();
      const mockUser = createMockUser();
      const mockGarden = createMockGarden();

      (SessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (hederaLib.submitHCSMessage as jest.Mock).mockResolvedValue({
        transactionId: 'tx-123',
        topicId: '0.0.9999',
        timestamp: new Date(),
        sequenceNumber: 42,
      });

      const requestBody = {
        sessionId: mockSessionId,
        hederaAccountId: mockHederaAccountId,
        mode: 'meditation',
        actualDuration: 10,
        signedProof: Buffer.from('valid-signature').toString('base64'),
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe(mockSessionId);
      expect(data.xpEarned).toBe(150); // 10 minutes * 10 base XP * 1.5 meditation multiplier
      expect(data.totalXP).toBe(250); // 100 + 150
      expect(data.level).toBeGreaterThanOrEqual(2);
      expect(data.gardenPreview).toBeDefined();
      expect(data.gardenPreview.tilesCompleted).toBe(4); // 3 + 1 new
      expect(data.hcsMetadata).toBeDefined();
      expect(data.hcsMetadata?.sequenceNumber).toBe(42);

      // Verify session was updated
      expect(mockSession.save).toHaveBeenCalled();
      expect(mockSession.completed).toBe(true);
      expect(mockSession.xpEarned).toBe(150);

      // Verify user stats were updated
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.totalXP).toBe(250);
      expect(mockUser.sessionsCompleted).toBe(6);
      expect(mockUser.totalMinutes).toBe(60);

      // Verify garden was updated
      expect(mockGarden.save).toHaveBeenCalled();
    });

    it('should complete session with encrypted reflection', async () => {
      const mockSession = createMockSession();
      const mockUser = createMockUser();
      const mockGarden = createMockGarden();

      (SessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (hederaLib.submitHCSMessage as jest.Mock).mockResolvedValue({
        transactionId: 'tx-123',
        topicId: '0.0.9999',
        timestamp: new Date(),
        sequenceNumber: 42,
      });

      const requestBody = {
        sessionId: mockSessionId,
        hederaAccountId: mockHederaAccountId,
        mode: 'focus',
        actualDuration: 20,
        signedProof: Buffer.from('valid-signature').toString('base64'),
        encryptedReflection: {
          ciphertext: 'encrypted-base64-content',
          iv: 'iv-base64',
          salt: 'salt-base64',
        },
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.xpEarned).toBe(240); // 20 * 10 * 1.2 focus multiplier

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

      // Verify HCS message includes reflection hash and CID
      expect(hederaLib.submitHCSMessage).toHaveBeenCalledWith(
        '0.0.9999',
        expect.objectContaining({
          reflectionHash: mockHash,
          reflectionCID: mockCID,
        })
      );
    });

    it('should handle IPFS upload failure gracefully', async () => {
      const mockSession = createMockSession();
      const mockUser = createMockUser();
      const mockGarden = createMockGarden();

      (SessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (ipfsLib.uploadEncryptedReflectionToIPFS as jest.Mock).mockRejectedValue(
        new Error('IPFS upload failed')
      );
      (hederaLib.submitHCSMessage as jest.Mock).mockResolvedValue({
        transactionId: 'tx-123',
        topicId: '0.0.9999',
        timestamp: new Date(),
        sequenceNumber: 42,
      });

      const requestBody = {
        sessionId: mockSessionId,
        hederaAccountId: mockHederaAccountId,
        mode: 'meditation',
        actualDuration: 10,
        signedProof: Buffer.from('valid-signature').toString('base64'),
        encryptedReflection: {
          ciphertext: 'encrypted-content',
          iv: 'iv',
          salt: 'salt',
        },
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Should still succeed without CID
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify session was saved with hash but no CID
      expect(mockSession.encryptedReflection).toBeDefined();
      expect(mockSession.encryptedReflection.hash).toBe(mockHash);
      expect(mockSession.encryptedReflection.cid).toBeUndefined();
    });

    it('should complete garden when 9th tile is filled', async () => {
      const mockSession = createMockSession();
      const mockUser = createMockUser();
      const mockGarden = createMockGarden({
        tiles: Array.from({ length: 9 }, (_, i) => ({
          id: i,
          completed: i < 8, // 8 tiles already completed
          sessionType: i < 8 ? 'meditation' : undefined,
          completedAt: i < 8 ? new Date() : undefined,
        })),
      });

      (SessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (hederaLib.submitHCSMessage as jest.Mock).mockResolvedValue({
        transactionId: 'tx-123',
        topicId: '0.0.9999',
        timestamp: new Date(),
        sequenceNumber: 42,
      });

      const requestBody = {
        sessionId: mockSessionId,
        hederaAccountId: mockHederaAccountId,
        mode: 'meditation',
        actualDuration: 10,
        signedProof: Buffer.from('valid-signature').toString('base64'),
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.gardenPreview.isGridComplete).toBe(true);
      expect(data.gardenPreview.tilesCompleted).toBe(9);
      expect(data.gardenPreview.completionDate).toBeDefined();

      // Verify garden metadata was set
      expect(mockGarden.nftMetadata).toBeDefined();
      expect(mockGarden.nftMetadata.completionDate).toBeDefined();
    });
  });

  describe('Invalid Requests', () => {
    it('should return 400 for missing sessionId', async () => {
      const requestBody = {
        hederaAccountId: mockHederaAccountId,
        mode: 'meditation',
        actualDuration: 10,
        signedProof: 'signature',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid request parameters');
    });

    it('should return 404 for non-existent session', async () => {
      (SessionModel.findById as jest.Mock).mockResolvedValue(null);

      const requestBody = {
        sessionId: 'non-existent-id',
        hederaAccountId: mockHederaAccountId,
        mode: 'meditation',
        actualDuration: 10,
        signedProof: 'signature',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Session not found');
    });

    it('should return 403 for session belonging to different account', async () => {
      const mockSession = createMockSession({
        hederaAccountId: '0.0.99999', // Different account
      });

      (SessionModel.findById as jest.Mock).mockResolvedValue(mockSession);

      const requestBody = {
        sessionId: mockSessionId,
        hederaAccountId: mockHederaAccountId,
        mode: 'meditation',
        actualDuration: 10,
        signedProof: 'signature',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Session does not belong to this account');
    });

    it('should return 400 for already completed session', async () => {
      const mockSession = createMockSession({
        completed: true,
      });

      (SessionModel.findById as jest.Mock).mockResolvedValue(mockSession);

      const requestBody = {
        sessionId: mockSessionId,
        hederaAccountId: mockHederaAccountId,
        mode: 'meditation',
        actualDuration: 10,
        signedProof: 'signature',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Session already completed');
    });

    it('should return 401 for invalid signature', async () => {
      const mockSession = createMockSession();
      (SessionModel.findById as jest.Mock).mockResolvedValue(mockSession);

      // Mock invalid signature
      const authModule = require('@/utils/auth');
      authModule.verifySignedProof = jest.fn().mockReturnValue(false);

      const requestBody = {
        sessionId: mockSessionId,
        hederaAccountId: mockHederaAccountId,
        mode: 'meditation',
        actualDuration: 10,
        signedProof: 'invalid-signature',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid signature or proof');
    });

    it('should return 404 for non-existent user', async () => {
      const mockSession = createMockSession();
      (SessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const requestBody = {
        sessionId: mockSessionId,
        hederaAccountId: mockHederaAccountId,
        mode: 'meditation',
        actualDuration: 10,
        signedProof: 'signature',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('User not found');
    });
  });

  describe('HCS Integration', () => {
    it('should submit HCS message with all required fields', async () => {
      const mockSession = createMockSession();
      const mockUser = createMockUser();
      const mockGarden = createMockGarden();

      (SessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (hederaLib.submitHCSMessage as jest.Mock).mockResolvedValue({
        transactionId: 'tx-123',
        topicId: '0.0.9999',
        timestamp: new Date(),
        sequenceNumber: 42,
      });

      const requestBody = {
        sessionId: mockSessionId,
        hederaAccountId: mockHederaAccountId,
        mode: 'meditation',
        actualDuration: 10,
        signedProof: 'signature',
      };

      const request = createMockRequest(requestBody);
      await POST(request);

      expect(hederaLib.submitHCSMessage).toHaveBeenCalledWith(
        '0.0.9999',
        expect.objectContaining({
          sessionId: mockSessionId,
          userId: mockUserId,
          hederaAccountId: mockHederaAccountId,
          mode: 'meditation',
          duration: 10,
          xpEarned: 150,
          nonce: mockNonce,
        })
      );
    });

    it('should continue without HCS if topic ID not configured', async () => {
      delete process.env.HEDERA_HCS_TOPIC_ID;

      const mockSession = createMockSession();
      const mockUser = createMockUser();
      const mockGarden = createMockGarden();

      (SessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);

      const requestBody = {
        sessionId: mockSessionId,
        hederaAccountId: mockHederaAccountId,
        mode: 'meditation',
        actualDuration: 10,
        signedProof: 'signature',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.hcsMetadata).toBeUndefined();
      expect(hederaLib.submitHCSMessage).not.toHaveBeenCalled();
    });

    it('should handle HCS submission failure gracefully', async () => {
      const mockSession = createMockSession();
      const mockUser = createMockUser();
      const mockGarden = createMockGarden();

      (SessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (hederaLib.submitHCSMessage as jest.Mock).mockRejectedValue(
        new Error('HCS submission failed')
      );

      const requestBody = {
        sessionId: mockSessionId,
        hederaAccountId: mockHederaAccountId,
        mode: 'meditation',
        actualDuration: 10,
        signedProof: 'signature',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Should still succeed without HCS metadata
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.hcsMetadata).toBeUndefined();
    });
  });

  describe('XP Calculation', () => {
    it('should calculate XP correctly for different modes', async () => {
      const mockSession = createMockSession();
      const mockUser = createMockUser();
      const mockGarden = createMockGarden();

      (SessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);

      const testCases = [
        { mode: 'meditation', duration: 10, expectedXP: 150 }, // 10 * 10 * 1.5
        { mode: 'focus', duration: 20, expectedXP: 240 },      // 20 * 10 * 1.2
        { mode: 'breathwork', duration: 15, expectedXP: 195 }, // 15 * 10 * 1.3
        { mode: 'calm', duration: 10, expectedXP: 100 },       // 10 * 10 * 1.0
        { mode: 'gratitude', duration: 10, expectedXP: 110 },  // 10 * 10 * 1.1
      ];

      for (const testCase of testCases) {
        mockSession.completed = false; // Reset
        const requestBody = {
          sessionId: mockSessionId,
          hederaAccountId: mockHederaAccountId,
          mode: testCase.mode,
          actualDuration: testCase.duration,
          signedProof: 'signature',
        };

        const request = createMockRequest(requestBody);
        const response = await POST(request);
        const data = await response.json();

        expect(data.xpEarned).toBe(testCase.expectedXP);
      }
    });
  });
});
