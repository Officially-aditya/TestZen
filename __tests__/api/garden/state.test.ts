import { GET } from '@/app/api/garden/state/route';
import { NextRequest } from 'next/server';
import { Garden } from '@/models/Garden';
import { SessionModel } from '@/models/Session';
import dbConnect from '@/lib/mongodb';

// Mock dependencies
jest.mock('@/lib/mongodb');
jest.mock('@/models/Garden');
jest.mock('@/models/Session');

describe('GET /api/garden/state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dbConnect as jest.Mock).mockResolvedValue(undefined);
  });

  const createMockRequest = (options: {
    userId?: string;
    walletAddress?: string;
    useHeader?: boolean;
  }): NextRequest => {
    const { userId, walletAddress, useHeader = false } = options;
    
    let url = 'http://localhost:3000/api/garden/state';
    const params = new URLSearchParams();
    
    if (!useHeader) {
      if (userId) params.append('userId', userId);
      if (walletAddress) params.append('walletAddress', walletAddress);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const headers: Record<string, string> = {};
    if (useHeader) {
      if (userId) headers['x-user-id'] = userId;
      if (walletAddress) headers['x-wallet-address'] = walletAddress;
    }
    
    return {
      url,
      headers: {
        get: (name: string) => headers[name] || null,
      },
    } as unknown as NextRequest;
  };

  describe('Authentication', () => {
    it('should return 401 when no authentication provided', async () => {
      const request = createMockRequest({});
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Authentication required');
    });

    it('should accept userId from query parameter', async () => {
      (Garden.findOne as jest.Mock).mockResolvedValue(null);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Garden.findOne).toHaveBeenCalledWith({ userId: 'user-123' });
    });

    it('should accept walletAddress from query parameter', async () => {
      (Garden.findOne as jest.Mock).mockResolvedValue(null);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = createMockRequest({ walletAddress: '0.0.123456' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Garden.findOne).toHaveBeenCalledWith({ walletAddress: '0.0.123456' });
    });

    it('should accept authentication from headers', async () => {
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: Array.from({ length: 9 }, (_, i) => ({ id: i, completed: false })),
        nftMinted: false,
      };

      (Garden.findOne as jest.Mock).mockResolvedValue(null);
      (Garden.create as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = createMockRequest({ 
        userId: 'user-123',
        walletAddress: '0.0.123456',
        useHeader: true,
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Default State for New Users', () => {
    it('should return default state when no garden exists', async () => {
      (Garden.findOne as jest.Mock).mockResolvedValue(null);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = createMockRequest({ userId: 'new-user' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.grid).toHaveLength(9);
      expect(data.data.grid.every((tile: any) => !tile.completed)).toBe(true);
      expect(data.data.xp.total).toBe(0);
      expect(data.data.xp.level).toBe(1);
      expect(data.data.sessions.total).toBe(0);
      expect(data.data.nftEligible).toBe(false);
    });

    it('should create default garden when both userId and walletAddress provided', async () => {
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: Array.from({ length: 9 }, (_, i) => ({ id: i, completed: false })),
        nftMinted: false,
      };

      (Garden.findOne as jest.Mock).mockResolvedValue(null);
      (Garden.create as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = createMockRequest({ 
        userId: 'user-123',
        walletAddress: '0.0.123456',
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Garden.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          walletAddress: '0.0.123456',
          tiles: expect.arrayContaining([
            expect.objectContaining({ id: 0, completed: false }),
          ]),
        })
      );
    });
  });

  describe('XP and Level Calculations', () => {
    it('should calculate correct XP totals from sessions', async () => {
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: Array.from({ length: 9 }, (_, i) => ({ id: i, completed: false })),
        nftMinted: false,
      };

      const mockSessions = [
        { xpEarned: 100, mode: 'meditation', completed: true },
        { xpEarned: 150, mode: 'focus', completed: true },
        { xpEarned: 50, mode: 'breathwork', completed: true },
      ];

      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockSessions),
      });

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.xp.total).toBe(300);
      expect(data.data.sessions.total).toBe(3);
    });

    it('should calculate level using formula: floor(sqrt(totalXP / 100)) + 1', async () => {
      const testCases = [
        { totalXP: 0, expectedLevel: 1 },
        { totalXP: 100, expectedLevel: 2 },
        { totalXP: 400, expectedLevel: 3 },
        { totalXP: 900, expectedLevel: 4 },
        { totalXP: 2500, expectedLevel: 6 },
      ];

      for (const testCase of testCases) {
        const mockGarden = {
          userId: 'user-123',
          walletAddress: '0.0.123456',
          tiles: Array.from({ length: 9 }, (_, i) => ({ id: i, completed: false })),
          nftMinted: false,
        };

        const mockSessions = testCase.totalXP > 0 ? [{ xpEarned: testCase.totalXP, mode: 'meditation', completed: true }] : [];

        (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
        (SessionModel.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSessions),
        });

        const request = createMockRequest({ userId: 'user-123' });
        const response = await GET(request);
        const data = await response.json();

        expect(data.data.xp.level).toBe(testCase.expectedLevel);
      }
    });

    it('should calculate progress toward next level correctly', async () => {
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: Array.from({ length: 9 }, (_, i) => ({ id: i, completed: false })),
        nftMinted: false,
      };

      // 150 XP = Level 2 (100 XP for level 2, 400 XP for level 3)
      // Progress = (150 - 100) / (400 - 100) = 50 / 300 = 16%
      const mockSessions = [{ xpEarned: 150, mode: 'meditation', completed: true }];

      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockSessions),
      });

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.xp.total).toBe(150);
      expect(data.data.xp.level).toBe(2);
      expect(data.data.xp.currentLevelXP).toBe(100);
      expect(data.data.xp.nextLevelXP).toBe(400);
      expect(data.data.xp.progressPercent).toBe(16);
    });
  });

  describe('Session Counts by Mode', () => {
    it('should count sessions by mode correctly', async () => {
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: Array.from({ length: 9 }, (_, i) => ({ id: i, completed: false })),
        nftMinted: false,
      };

      const mockSessions = [
        { xpEarned: 100, mode: 'meditation', completed: true },
        { xpEarned: 100, mode: 'meditation', completed: true },
        { xpEarned: 100, mode: 'focus', completed: true },
        { xpEarned: 100, mode: 'breathwork', completed: true },
        { xpEarned: 100, mode: 'breathwork', completed: true },
        { xpEarned: 100, mode: 'breathwork', completed: true },
      ];

      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockSessions),
      });

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.sessions.byMode).toEqual({
        meditation: 2,
        focus: 1,
        breathwork: 3,
      });
    });
  });

  describe('Garden Grid State', () => {
    it('should return grid with completed tiles', async () => {
      const now = new Date();
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: [
          { id: 0, completed: true, sessionType: 'meditation', completedAt: now },
          { id: 1, completed: true, sessionType: 'focus', completedAt: now },
          { id: 2, completed: false },
          { id: 3, completed: false },
          { id: 4, completed: false },
          { id: 5, completed: false },
          { id: 6, completed: false },
          { id: 7, completed: false },
          { id: 8, completed: false },
        ],
        nftMinted: false,
      };

      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.grid).toHaveLength(9);
      expect(data.data.grid[0].completed).toBe(true);
      expect(data.data.grid[0].sessionType).toBe('meditation');
      expect(data.data.grid[0].completedAt).toBe(now.toISOString());
      expect(data.data.grid[1].completed).toBe(true);
      expect(data.data.grid[2].completed).toBe(false);
    });

    it('should indicate NFT eligibility when all tiles completed', async () => {
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: Array.from({ length: 9 }, (_, i) => ({
          id: i,
          completed: true,
          sessionType: 'meditation',
        })),
        nftMinted: false,
      };

      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.nftEligible).toBe(true);
    });

    it('should not indicate NFT eligibility when tiles incomplete', async () => {
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: Array.from({ length: 9 }, (_, i) => ({
          id: i,
          completed: i < 5,
          sessionType: i < 5 ? 'meditation' : undefined,
        })),
        nftMinted: false,
      };

      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.nftEligible).toBe(false);
    });

    it('should not indicate NFT eligibility when already minted', async () => {
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: Array.from({ length: 9 }, (_, i) => ({
          id: i,
          completed: true,
          sessionType: 'meditation',
        })),
        nftMinted: true,
      };

      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.nftEligible).toBe(false);
    });
  });

  describe('NFT Badge Metadata', () => {
    it('should include badge metadata when NFT is minted', async () => {
      const mintedDate = new Date('2024-01-15T10:00:00Z');
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: Array.from({ length: 9 }, (_, i) => ({
          id: i,
          completed: true,
          sessionType: 'meditation',
        })),
        nftMinted: true,
        nftMetadata: {
          tokenId: '0.0.789',
          serialNumber: '1',
          mintedAt: mintedDate,
          level: 5,
          totalXP: 2500,
          completionDate: new Date(),
          cid: 'bafytest',
        },
      };

      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.badge).toBeDefined();
      expect(data.data.badge.tokenId).toBe('0.0.789');
      expect(data.data.badge.serialNumber).toBe('1');
      expect(data.data.badge.mintedAt).toBe(mintedDate.toISOString());
      expect(data.data.badge.level).toBe(5);
      expect(data.data.badge.totalXP).toBe(2500);
    });

    it('should not include badge metadata when NFT not minted', async () => {
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: Array.from({ length: 9 }, (_, i) => ({ id: i, completed: false })),
        nftMinted: false,
      };

      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.badge).toBeUndefined();
    });
  });

  describe('Caching Headers', () => {
    it('should include no-store cache control header for sensitive data', async () => {
      (Garden.findOne as jest.Mock).mockResolvedValue(null);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when database connection fails', async () => {
      (dbConnect as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Database connection failed');
    });

    it('should return 500 when garden query fails', async () => {
      (Garden.findOne as jest.Mock).mockRejectedValue(new Error('Query failed'));

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should return 500 when session aggregation fails', async () => {
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: Array.from({ length: 9 }, (_, i) => ({ id: i, completed: false })),
        nftMinted: false,
      };

      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Session query failed')),
      });

      const request = createMockRequest({ userId: 'user-123' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Complete Workflow Scenarios', () => {
    it('should return complete state for user with partial progress', async () => {
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: Array.from({ length: 9 }, (_, i) => ({
          id: i,
          completed: i < 3,
          sessionType: i < 3 ? 'meditation' : undefined,
        })),
        nftMinted: false,
      };

      const mockSessions = [
        { xpEarned: 100, mode: 'meditation', completed: true },
        { xpEarned: 100, mode: 'focus', completed: true },
        { xpEarned: 100, mode: 'breathwork', completed: true },
      ];

      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockSessions),
      });

      const request = createMockRequest({ walletAddress: '0.0.123456' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.grid.filter((t: any) => t.completed)).toHaveLength(3);
      expect(data.data.xp.total).toBe(300);
      expect(data.data.sessions.total).toBe(3);
      expect(data.data.nftEligible).toBe(false);
      expect(data.data.badge).toBeUndefined();
    });

    it('should return complete state for user ready to mint NFT', async () => {
      const mockGarden = {
        userId: 'user-123',
        walletAddress: '0.0.123456',
        tiles: Array.from({ length: 9 }, (_, i) => ({
          id: i,
          completed: true,
          sessionType: 'meditation',
          completedAt: new Date(),
        })),
        nftMinted: false,
      };

      const mockSessions = Array.from({ length: 27 }, () => ({
        xpEarned: 100,
        mode: 'meditation',
        completed: true,
      }));

      (Garden.findOne as jest.Mock).mockResolvedValue(mockGarden);
      (SessionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockSessions),
      });

      const request = createMockRequest({ walletAddress: '0.0.123456' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.grid.every((t: any) => t.completed)).toBe(true);
      expect(data.data.xp.total).toBe(2700);
      expect(data.data.sessions.total).toBe(27);
      expect(data.data.nftEligible).toBe(true);
      expect(data.data.badge).toBeUndefined();
    });
  });
});
