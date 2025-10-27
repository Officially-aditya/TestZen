import { IGarden, IGardenTile } from '@/models/Garden';
import { SessionModeType } from './types';

const GRID_SIZE = 9; // 3x3 grid

/**
 * Initialize a new garden with 9 empty tiles
 */
export function initializeGarden(): IGardenTile[] {
  const tiles: IGardenTile[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    tiles.push({
      id: i,
      completed: false,
    });
  }
  return tiles;
}

/**
 * Update garden progression after a completed session
 * Marks the next available tile as completed
 * Returns updated tiles and whether the grid is complete
 */
export function updateGardenProgression(
  currentTiles: IGardenTile[],
  sessionType: SessionModeType
): {
  tiles: IGardenTile[];
  nextTileId: number | undefined;
  isGridComplete: boolean;
  completionDate: Date | undefined;
} {
  // Find the first incomplete tile
  const nextTileIndex = currentTiles.findIndex(tile => !tile.completed);
  
  if (nextTileIndex === -1) {
    // All tiles already completed
    return {
      tiles: currentTiles,
      nextTileId: undefined,
      isGridComplete: true,
      completionDate: undefined, // Already completed before
    };
  }
  
  // Mark the tile as completed
  const updatedTiles = [...currentTiles];
  const completionDate = new Date();
  updatedTiles[nextTileIndex] = {
    ...updatedTiles[nextTileIndex],
    completed: true,
    sessionType,
    completedAt: completionDate,
  };
  
  // Check if this completion finishes the grid
  const allCompleted = updatedTiles.every(tile => tile.completed);
  
  // Find next tile if not all completed
  const nextTileId = allCompleted 
    ? undefined 
    : updatedTiles.findIndex(tile => !tile.completed);
  
  return {
    tiles: updatedTiles,
    nextTileId: nextTileId !== undefined && nextTileId >= 0 ? nextTileId : undefined,
    isGridComplete: allCompleted,
    completionDate: allCompleted ? completionDate : undefined,
  };
}

/**
 * Get garden preview information
 */
export function getGardenPreview(garden: IGarden | null) {
  if (!garden) {
    return {
      tilesCompleted: 0,
      totalTiles: GRID_SIZE,
      nextTileId: 0,
      isGridComplete: false,
      completionDate: undefined,
    };
  }
  
  const tilesCompleted = garden.tiles.filter(tile => tile.completed).length;
  const isGridComplete = tilesCompleted === GRID_SIZE;
  const nextTileId = garden.tiles.findIndex(tile => !tile.completed);
  
  return {
    tilesCompleted,
    totalTiles: GRID_SIZE,
    nextTileId: nextTileId >= 0 ? nextTileId : undefined,
    isGridComplete,
    completionDate: isGridComplete && garden.nftMetadata?.completionDate 
      ? garden.nftMetadata.completionDate.toISOString() 
      : undefined,
  };
}

/**
 * Check if garden is ready for NFT minting
 * A garden is ready when all 9 tiles are completed
 */
export function isGardenReadyForNFT(garden: IGarden): boolean {
  return garden.tiles.every(tile => tile.completed) && !garden.nftMinted;
}
