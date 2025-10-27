import { 
  initializeGarden, 
  updateGardenProgression, 
  getGardenPreview,
  isGardenReadyForNFT 
} from '@/utils/garden';
import { IGarden } from '@/models/Garden';

describe('Garden Utilities', () => {
  describe('initializeGarden', () => {
    it('should create 9 empty tiles', () => {
      const tiles = initializeGarden();
      expect(tiles).toHaveLength(9);
      tiles.forEach((tile, index) => {
        expect(tile.id).toBe(index);
        expect(tile.completed).toBe(false);
      });
    });
  });

  describe('updateGardenProgression', () => {
    it('should mark the first incomplete tile as completed', () => {
      const tiles = initializeGarden();
      const result = updateGardenProgression(tiles, 'meditation');

      expect(result.tiles[0].completed).toBe(true);
      expect(result.tiles[0].sessionType).toBe('meditation');
      expect(result.tiles[0].completedAt).toBeDefined();
      expect(result.nextTileId).toBe(1);
      expect(result.isGridComplete).toBe(false);
    });

    it('should mark subsequent tiles as sessions complete', () => {
      let tiles = initializeGarden();
      
      // Complete first 3 tiles
      for (let i = 0; i < 3; i++) {
        const result = updateGardenProgression(tiles, 'focus');
        tiles = result.tiles;
      }

      expect(tiles[0].completed).toBe(true);
      expect(tiles[1].completed).toBe(true);
      expect(tiles[2].completed).toBe(true);
      expect(tiles[3].completed).toBe(false);
    });

    it('should detect grid completion on 9th tile', () => {
      let tiles = initializeGarden();
      
      // Complete all 9 tiles
      for (let i = 0; i < 9; i++) {
        const result = updateGardenProgression(tiles, 'meditation');
        tiles = result.tiles;
      }

      const finalResult = updateGardenProgression(tiles, 'meditation');
      expect(finalResult.isGridComplete).toBe(true);
      expect(finalResult.nextTileId).toBeUndefined();
    });

    it('should set completion date when grid is completed', () => {
      let tiles = initializeGarden();
      let completionDate;
      
      // Complete 8 tiles
      for (let i = 0; i < 8; i++) {
        const result = updateGardenProgression(tiles, 'breathwork');
        tiles = result.tiles;
      }

      // Complete the final tile
      const result = updateGardenProgression(tiles, 'breathwork');
      expect(result.isGridComplete).toBe(true);
      expect(result.completionDate).toBeDefined();
    });

    it('should handle partially completed garden', () => {
      const tiles = [
        { id: 0, completed: true, sessionType: 'meditation' as const, completedAt: new Date() },
        { id: 1, completed: true, sessionType: 'focus' as const, completedAt: new Date() },
        { id: 2, completed: true, sessionType: 'breathwork' as const, completedAt: new Date() },
        { id: 3, completed: false },
        { id: 4, completed: false },
        { id: 5, completed: false },
        { id: 6, completed: false },
        { id: 7, completed: false },
        { id: 8, completed: false },
      ];

      const result = updateGardenProgression(tiles, 'calm');
      expect(result.tiles[3].completed).toBe(true);
      expect(result.tiles[3].sessionType).toBe('calm');
      expect(result.nextTileId).toBe(4);
      expect(result.isGridComplete).toBe(false);
    });

    it('should handle already completed garden', () => {
      const tiles = Array.from({ length: 9 }, (_, i) => ({
        id: i,
        completed: true,
        sessionType: 'meditation' as const,
        completedAt: new Date(),
      }));

      const result = updateGardenProgression(tiles, 'focus');
      expect(result.isGridComplete).toBe(true);
      expect(result.nextTileId).toBeUndefined();
      expect(result.completionDate).toBeUndefined(); // Already completed before
    });
  });

  describe('getGardenPreview', () => {
    it('should return preview for null garden', () => {
      const preview = getGardenPreview(null);
      expect(preview.tilesCompleted).toBe(0);
      expect(preview.totalTiles).toBe(9);
      expect(preview.nextTileId).toBe(0);
      expect(preview.isGridComplete).toBe(false);
    });

    it('should return preview for empty garden', () => {
      const garden = {
        tiles: initializeGarden(),
        nftMinted: false,
      } as IGarden;

      const preview = getGardenPreview(garden);
      expect(preview.tilesCompleted).toBe(0);
      expect(preview.totalTiles).toBe(9);
      expect(preview.nextTileId).toBe(0);
      expect(preview.isGridComplete).toBe(false);
    });

    it('should return preview for partially completed garden', () => {
      const garden = {
        tiles: [
          { id: 0, completed: true, sessionType: 'meditation', completedAt: new Date() },
          { id: 1, completed: true, sessionType: 'focus', completedAt: new Date() },
          { id: 2, completed: true, sessionType: 'breathwork', completedAt: new Date() },
          { id: 3, completed: false },
          { id: 4, completed: false },
          { id: 5, completed: false },
          { id: 6, completed: false },
          { id: 7, completed: false },
          { id: 8, completed: false },
        ],
        nftMinted: false,
      } as IGarden;

      const preview = getGardenPreview(garden);
      expect(preview.tilesCompleted).toBe(3);
      expect(preview.totalTiles).toBe(9);
      expect(preview.nextTileId).toBe(3);
      expect(preview.isGridComplete).toBe(false);
    });

    it('should return preview for completed garden', () => {
      const completionDate = new Date();
      const garden = {
        tiles: Array.from({ length: 9 }, (_, i) => ({
          id: i,
          completed: true,
          sessionType: 'meditation',
          completedAt: new Date(),
        })),
        nftMinted: false,
        nftMetadata: {
          level: 5,
          totalXP: 1000,
          completionDate,
        },
      } as IGarden;

      const preview = getGardenPreview(garden);
      expect(preview.tilesCompleted).toBe(9);
      expect(preview.totalTiles).toBe(9);
      expect(preview.nextTileId).toBeUndefined();
      expect(preview.isGridComplete).toBe(true);
      expect(preview.completionDate).toBe(completionDate.toISOString());
    });
  });

  describe('isGardenReadyForNFT', () => {
    it('should return false for incomplete garden', () => {
      const garden = {
        tiles: initializeGarden(),
        nftMinted: false,
      } as IGarden;

      expect(isGardenReadyForNFT(garden)).toBe(false);
    });

    it('should return true for completed garden not yet minted', () => {
      const garden = {
        tiles: Array.from({ length: 9 }, (_, i) => ({
          id: i,
          completed: true,
          sessionType: 'meditation',
          completedAt: new Date(),
        })),
        nftMinted: false,
      } as IGarden;

      expect(isGardenReadyForNFT(garden)).toBe(true);
    });

    it('should return false for already minted garden', () => {
      const garden = {
        tiles: Array.from({ length: 9 }, (_, i) => ({
          id: i,
          completed: true,
          sessionType: 'meditation',
          completedAt: new Date(),
        })),
        nftMinted: true,
      } as IGarden;

      expect(isGardenReadyForNFT(garden)).toBe(false);
    });

    it('should return false for partially completed garden', () => {
      const garden = {
        tiles: Array.from({ length: 9 }, (_, i) => ({
          id: i,
          completed: i < 5,
          sessionType: i < 5 ? 'meditation' : undefined,
          completedAt: i < 5 ? new Date() : undefined,
        })),
        nftMinted: false,
      } as IGarden;

      expect(isGardenReadyForNFT(garden)).toBe(false);
    });
  });
});
