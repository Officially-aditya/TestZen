import mongoose from 'mongoose';
import { Garden, IGarden, IGardenTile } from '@/models/Garden';
import { initializeGarden } from '@/utils/garden';

describe('Garden Model', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/testzen-test');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Garden.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a garden with valid data', async () => {
      const tiles = initializeGarden();
      const gardenData = {
        userId: 'user123',
        walletAddress: '0x1234567890abcdef',
        tiles,
        nftMinted: false,
      };

      const garden = new Garden(gardenData);
      const savedGarden = await garden.save();

      expect(savedGarden._id).toBeDefined();
      expect(savedGarden.userId).toBe('user123');
      expect(savedGarden.walletAddress).toBe('0x1234567890abcdef');
      expect(savedGarden.tiles).toHaveLength(9);
      expect(savedGarden.nftMinted).toBe(false);
      expect(savedGarden.createdAt).toBeDefined();
      expect(savedGarden.updatedAt).toBeDefined();
    });

    it('should apply default values correctly', async () => {
      const tiles = initializeGarden();
      const garden = new Garden({
        userId: 'user456',
        walletAddress: '0xabcdef123456',
        tiles,
      });

      const savedGarden = await garden.save();

      expect(savedGarden.nftMinted).toBe(false);
    });

    it('should require userId', async () => {
      const tiles = initializeGarden();
      const garden = new Garden({
        walletAddress: '0x1111111111',
        tiles,
      });

      await expect(garden.save()).rejects.toThrow();
    });

    it('should require walletAddress', async () => {
      const tiles = initializeGarden();
      const garden = new Garden({
        userId: 'user789',
        tiles,
      });

      await expect(garden.save()).rejects.toThrow();
    });

    it('should require tiles', async () => {
      const garden = new Garden({
        userId: 'user999',
        walletAddress: '0x2222222222',
      });

      await expect(garden.save()).rejects.toThrow();
    });

    it('should enforce unique userId and walletAddress combination', async () => {
      const tiles1 = initializeGarden();
      const garden1 = new Garden({
        userId: 'user-unique',
        walletAddress: '0xunique-wallet',
        tiles: tiles1,
      });
      await garden1.save();

      const tiles2 = initializeGarden();
      const garden2 = new Garden({
        userId: 'user-unique',
        walletAddress: '0xunique-wallet',
        tiles: tiles2,
      });

      await expect(garden2.save()).rejects.toThrow();
    });
  });

  describe('Garden Tiles', () => {
    it('should store 3x3 grid correctly', async () => {
      const tiles: IGardenTile[] = Array.from({ length: 9 }, (_, i) => ({
        id: i,
        completed: false,
      }));

      const garden = new Garden({
        userId: 'user111',
        walletAddress: '0x3333333333',
        tiles,
      });

      const savedGarden = await garden.save();

      expect(savedGarden.tiles).toHaveLength(9);
      savedGarden.tiles.forEach((tile, index) => {
        expect(tile.id).toBe(index);
        expect(tile.completed).toBe(false);
      });
    });

    it('should store completed tiles with metadata', async () => {
      const completedDate = new Date();
      const tiles: IGardenTile[] = [
        { id: 0, completed: true, sessionType: 'meditation', completedAt: completedDate },
        { id: 1, completed: true, sessionType: 'focus', completedAt: completedDate },
        { id: 2, completed: false },
        { id: 3, completed: false },
        { id: 4, completed: false },
        { id: 5, completed: false },
        { id: 6, completed: false },
        { id: 7, completed: false },
        { id: 8, completed: false },
      ];

      const garden = new Garden({
        userId: 'user222',
        walletAddress: '0x4444444444',
        tiles,
      });

      const savedGarden = await garden.save();

      expect(savedGarden.tiles[0].completed).toBe(true);
      expect(savedGarden.tiles[0].sessionType).toBe('meditation');
      expect(savedGarden.tiles[0].completedAt?.getTime()).toBe(completedDate.getTime());
      
      expect(savedGarden.tiles[1].completed).toBe(true);
      expect(savedGarden.tiles[1].sessionType).toBe('focus');
      
      expect(savedGarden.tiles[2].completed).toBe(false);
      expect(savedGarden.tiles[2].sessionType).toBeUndefined();
    });

    it('should update tiles in existing garden', async () => {
      const tiles = initializeGarden();
      const garden = new Garden({
        userId: 'user333',
        walletAddress: '0x5555555555',
        tiles,
      });

      const savedGarden = await garden.save();

      savedGarden.tiles[0].completed = true;
      savedGarden.tiles[0].sessionType = 'breathwork';
      savedGarden.tiles[0].completedAt = new Date();

      await savedGarden.save();

      const updatedGarden = await Garden.findById(savedGarden._id);

      expect(updatedGarden?.tiles[0].completed).toBe(true);
      expect(updatedGarden?.tiles[0].sessionType).toBe('breathwork');
      expect(updatedGarden?.tiles[0].completedAt).toBeDefined();
    });
  });

  describe('NFT Metadata', () => {
    it('should store NFT metadata when garden is completed', async () => {
      const tiles = Array.from({ length: 9 }, (_, i) => ({
        id: i,
        completed: true,
        sessionType: 'meditation',
        completedAt: new Date(),
      }));

      const completionDate = new Date();
      const garden = new Garden({
        userId: 'user444',
        walletAddress: '0x6666666666',
        tiles,
        nftMinted: true,
        nftMetadata: {
          tokenId: 'token123',
          serialNumber: '1',
          cid: 'QmNFTMetadata123',
          transactionId: '0.0.123456@1234567890.123456789',
          mintedAt: new Date(),
          level: 5,
          totalXP: 1500,
          completionDate,
        },
      });

      const savedGarden = await garden.save();

      expect(savedGarden.nftMinted).toBe(true);
      expect(savedGarden.nftMetadata).toBeDefined();
      expect(savedGarden.nftMetadata?.tokenId).toBe('token123');
      expect(savedGarden.nftMetadata?.serialNumber).toBe('1');
      expect(savedGarden.nftMetadata?.cid).toBe('QmNFTMetadata123');
      expect(savedGarden.nftMetadata?.transactionId).toBe('0.0.123456@1234567890.123456789');
      expect(savedGarden.nftMetadata?.mintedAt).toBeDefined();
      expect(savedGarden.nftMetadata?.level).toBe(5);
      expect(savedGarden.nftMetadata?.totalXP).toBe(1500);
      expect(savedGarden.nftMetadata?.completionDate.getTime()).toBe(completionDate.getTime());
    });

    it('should handle NFT metadata with reflection hash', async () => {
      const tiles = Array.from({ length: 9 }, (_, i) => ({
        id: i,
        completed: true,
        sessionType: 'focus',
        completedAt: new Date(),
      }));

      const garden = new Garden({
        userId: 'user555',
        walletAddress: '0x7777777777',
        tiles,
        nftMinted: true,
        nftMetadata: {
          level: 3,
          totalXP: 800,
          completionDate: new Date(),
          reflectionHash: 'sha256-reflection-hash',
        },
      });

      const savedGarden = await garden.save();

      expect(savedGarden.nftMetadata?.reflectionHash).toBe('sha256-reflection-hash');
    });

    it('should handle garden without NFT metadata', async () => {
      const tiles = initializeGarden();
      const garden = new Garden({
        userId: 'user666',
        walletAddress: '0x8888888888',
        tiles,
        nftMinted: false,
      });

      const savedGarden = await garden.save();

      expect(savedGarden.nftMetadata).toBeUndefined();
    });
  });

  describe('Queries', () => {
    beforeEach(async () => {
      const garden1Tiles = initializeGarden();
      const garden2Tiles = initializeGarden();
      const garden3Tiles = initializeGarden();

      await Garden.create([
        {
          userId: 'user-a',
          walletAddress: '0xaaaa',
          tiles: garden1Tiles,
          nftMinted: false,
        },
        {
          userId: 'user-b',
          walletAddress: '0xbbbb',
          tiles: garden2Tiles,
          nftMinted: true,
        },
        {
          userId: 'user-c',
          walletAddress: '0xcccc',
          tiles: garden3Tiles,
          nftMinted: false,
        },
      ]);
    });

    it('should find garden by userId', async () => {
      const garden = await Garden.findOne({ userId: 'user-b' });

      expect(garden).toBeDefined();
      expect(garden?.userId).toBe('user-b');
      expect(garden?.nftMinted).toBe(true);
    });

    it('should find garden by walletAddress', async () => {
      const garden = await Garden.findOne({ walletAddress: '0xcccc' });

      expect(garden).toBeDefined();
      expect(garden?.userId).toBe('user-c');
    });

    it('should find unminted gardens', async () => {
      const unmintedGardens = await Garden.find({ nftMinted: false });

      expect(unmintedGardens).toHaveLength(2);
      expect(unmintedGardens.every(g => !g.nftMinted)).toBe(true);
    });

    it('should find minted gardens', async () => {
      const mintedGardens = await Garden.find({ nftMinted: true });

      expect(mintedGardens).toHaveLength(1);
      expect(mintedGardens[0].userId).toBe('user-b');
    });
  });

  describe('Indexes', () => {
    it('should create compound unique index on userId and walletAddress', async () => {
      const indexes = Garden.schema.indexes();
      
      const hasCompoundIndex = indexes.some(
        (index) => {
          const indexObj = index[0];
          const options = index[1];
          return JSON.stringify(indexObj) === JSON.stringify({ userId: 1, walletAddress: 1 }) &&
                 options?.unique === true;
        }
      );

      expect(hasCompoundIndex).toBe(true);
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      const tiles = initializeGarden();
      const garden = new Garden({
        userId: 'user777',
        walletAddress: '0x9999999999',
        tiles,
      });

      const savedGarden = await garden.save();

      expect(savedGarden.createdAt).toBeDefined();
      expect(savedGarden.updatedAt).toBeDefined();
    });

    it('should update updatedAt when garden is modified', async () => {
      const tiles = initializeGarden();
      const garden = new Garden({
        userId: 'user888',
        walletAddress: '0xaaaaaaaaaa',
        tiles,
      });

      const savedGarden = await garden.save();
      const originalUpdatedAt = savedGarden.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      savedGarden.tiles[0].completed = true;
      savedGarden.tiles[0].sessionType = 'calm';
      await savedGarden.save();

      expect(savedGarden.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Garden Completion Scenarios', () => {
    it('should handle progressive garden completion', async () => {
      const tiles = initializeGarden();
      const garden = new Garden({
        userId: 'user-progress',
        walletAddress: '0xprogress',
        tiles,
      });

      let savedGarden = await garden.save();

      for (let i = 0; i < 9; i++) {
        savedGarden.tiles[i].completed = true;
        savedGarden.tiles[i].sessionType = 'gratitude';
        savedGarden.tiles[i].completedAt = new Date();
        savedGarden = await savedGarden.save();

        const completedCount = savedGarden.tiles.filter(t => t.completed).length;
        expect(completedCount).toBe(i + 1);
      }

      const allCompleted = savedGarden.tiles.every(t => t.completed);
      expect(allCompleted).toBe(true);
    });

    it('should handle garden ready for minting', async () => {
      const completedTiles = Array.from({ length: 9 }, (_, i) => ({
        id: i,
        completed: true,
        sessionType: 'meditation',
        completedAt: new Date(),
      }));

      const garden = new Garden({
        userId: 'user-ready-mint',
        walletAddress: '0xready-mint',
        tiles: completedTiles,
        nftMinted: false,
      });

      const savedGarden = await garden.save();

      const allCompleted = savedGarden.tiles.every(t => t.completed);
      expect(allCompleted).toBe(true);
      expect(savedGarden.nftMinted).toBe(false);
    });
  });
});
