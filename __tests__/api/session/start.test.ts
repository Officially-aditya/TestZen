import { POST } from '@/app/api/session/start/route';
import { NextRequest } from 'next/server';
import { SessionModel } from '@/models/Session';
import { User } from '@/models/User';
import { Garden } from '@/models/Garden';
import dbConnect from '@/lib/mongodb';
import * as hederaLib from '@/lib/hedera';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/Session');
jest.mock('@/models/User');
jest.mock('@/models/Garden');
jest.mock('@/lib/hedera');

describe('POST /api/session/start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dbConnect as jest.Mock).mockResolvedValue(undefined);
    (hederaLib.validateAccountId as jest.Mock).mockReturnValue(true);
  });

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  describe('Valid Requests - New User', () => {
    it('should start session for new user and create user/garden', async () => {
      const mockUserId = 'mock-user-id-123';
      const mockSessionId = 'mock-session-id-123';
      const mockUser = {
        _id: mockUserId,
        hederaAccountId: '0.0.12345',
        totalXP: 0,
        level: 1,
        sessionsCompleted: 0,
        totalMinutes: 0,
        lastSessionAt: new Date(),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (Garden.create as jest.Mock).mockResolvedValue({});
      (SessionModel.create as jest.Mock).mockResolvedValue({
        _id: mockSessionId,
        nonce: 'mock-nonce-123',
      });

      const requestBody = {
        hederaAccountId: '0.0.12345',
        mode: 'meditation',
        targetDuration: 10,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe(mockSessionId);
      expect(data.nonce).toBeDefined();
      expect(data.mode).toBe('meditation');
      expect(data.targetDuration).toBe(10);
      expect(data.startTime).toBeDefined();

      // Verify user was created
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hederaAccountId: '0.0.12345',
          totalXP: 0,
          level: 1,
          sessionsCompleted: 0,
          totalMinutes: 0,
        })
      );

      // Verify garden was created
      expect(Garden.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          walletAddress: '0.0.12345',
          nftMinted: false,
        })
      );

      // Verify session was created
      expect(SessionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          hederaAccountId: '0.0.12345',
          mode: 'meditation',
          duration: 10,
          completed: false,
          xpEarned: 0,
        })
      );
    });
  });

  describe('Valid Requests - Existing User', () => {
    it('should start session for existing user', async () => {
      const mockUserId = 'existing-user-id';
      const mockSessionId = 'new-session-id';
      const mockUser = {
        _id: mockUserId,
        hederaAccountId: '0.0.67890',
        totalXP: 500,
        level: 3,
        sessionsCompleted: 5,
        totalMinutes: 50,
        lastSessionAt: new Date(),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (SessionModel.create as jest.Mock).mockResolvedValue({
        _id: mockSessionId,
        nonce: 'new-nonce-456',
      });

      const requestBody = {
        hederaAccountId: '0.0.67890',
        mode: 'focus',
        targetDuration: 25,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBe(mockSessionId);
      expect(data.mode).toBe('focus');

      // Verify user was found (not created)
      expect(User.findOne).toHaveBeenCalledWith({ hederaAccountId: '0.0.67890' });
      expect(User.create).not.toHaveBeenCalled();
      expect(Garden.create).not.toHaveBeenCalled();

      // Verify lastSessionAt was updated
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should support all valid session modes', async () => {
      const mockUser = {
        _id: 'user-id',
        save: jest.fn().mockResolvedValue(undefined),
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (SessionModel.create as jest.Mock).mockResolvedValue({
        _id: 'session-id',
        nonce: 'nonce',
      });

      const modes = ['meditation', 'focus', 'breathwork', 'calm', 'gratitude'];

      for (const mode of modes) {
        const requestBody = {
          hederaAccountId: '0.0.12345',
          mode,
          targetDuration: 15,
        };

        const request = createMockRequest(requestBody);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.mode).toBe(mode);
      }
    });
  });

  describe('Invalid Requests', () => {
    it('should return 400 for missing hederaAccountId', async () => {
      const requestBody = {
        mode: 'meditation',
        targetDuration: 10,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid request parameters');
      expect(SessionModel.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid hederaAccountId format (Zod validation)', async () => {
      const requestBody = {
        hederaAccountId: 'invalid-account-id',
        mode: 'meditation',
        targetDuration: 10,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid request parameters');
    });

    it('should return 400 for invalid hederaAccountId (Hedera validation)', async () => {
      (hederaLib.validateAccountId as jest.Mock).mockReturnValue(false);

      const requestBody = {
        hederaAccountId: '0.0.99999', // Valid format but invalid account
        mode: 'meditation',
        targetDuration: 10,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid Hedera account ID format');
      
      // Reset mock for other tests
      (hederaLib.validateAccountId as jest.Mock).mockReturnValue(true);
    });

    it('should return 400 for missing mode', async () => {
      const requestBody = {
        hederaAccountId: '0.0.12345',
        targetDuration: 10,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 for invalid mode', async () => {
      const requestBody = {
        hederaAccountId: '0.0.12345',
        mode: 'invalid-mode',
        targetDuration: 10,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 for missing targetDuration', async () => {
      const requestBody = {
        hederaAccountId: '0.0.12345',
        mode: 'meditation',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 for duration too short', async () => {
      const requestBody = {
        hederaAccountId: '0.0.12345',
        mode: 'meditation',
        targetDuration: 0,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 for duration too long', async () => {
      const requestBody = {
        hederaAccountId: '0.0.12345',
        mode: 'meditation',
        targetDuration: 121,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when database connection fails', async () => {
      (dbConnect as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      const requestBody = {
        hederaAccountId: '0.0.12345',
        mode: 'meditation',
        targetDuration: 10,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Database connection error');
    });

    it('should return 500 when user creation fails', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockRejectedValue(new Error('User creation failed'));

      const requestBody = {
        hederaAccountId: '0.0.12345',
        mode: 'meditation',
        targetDuration: 10,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Nonce Generation', () => {
    it('should generate unique nonce for each session', async () => {
      const mockUser = {
        _id: 'user-id',
        save: jest.fn().mockResolvedValue(undefined),
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const nonces = new Set<string>();
      (SessionModel.create as jest.Mock).mockImplementation((data) => {
        nonces.add(data.nonce);
        return Promise.resolve({
          _id: 'session-id',
          nonce: data.nonce,
        });
      });

      const requestBody = {
        hederaAccountId: '0.0.12345',
        mode: 'meditation',
        targetDuration: 10,
      };

      // Create multiple sessions
      for (let i = 0; i < 5; i++) {
        const request = createMockRequest(requestBody);
        await POST(request);
      }

      // Verify all nonces are unique
      expect(nonces.size).toBe(5);
    });
  });
});
