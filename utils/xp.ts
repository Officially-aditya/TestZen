import { SessionModeType } from './types';

/**
 * Calculate XP earned based on session duration and mode
 * Base XP: 10 per minute
 * Mode multipliers:
 * - meditation: 1.5x
 * - focus: 1.2x
 * - breathwork: 1.3x
 * - calm: 1.0x
 * - gratitude: 1.1x
 */
export function calculateXP(durationMinutes: number, mode: SessionModeType): number {
  const BASE_XP_PER_MINUTE = 10;
  
  const modeMultipliers: Record<SessionModeType, number> = {
    meditation: 1.5,
    focus: 1.2,
    breathwork: 1.3,
    calm: 1.0,
    gratitude: 1.1,
  };
  
  const multiplier = modeMultipliers[mode] || 1.0;
  const xp = Math.floor(durationMinutes * BASE_XP_PER_MINUTE * multiplier);
  
  return xp;
}

/**
 * Calculate user level based on total XP
 * Level formula: level = floor(sqrt(totalXP / 100)) + 1
 * This creates a smooth progression where:
 * - Level 1: 0-99 XP
 * - Level 2: 100-399 XP
 * - Level 3: 400-899 XP
 * - Level 4: 900-1599 XP
 * - Level 5: 1600-2499 XP
 * etc.
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

/**
 * Get XP required for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  return currentLevel * currentLevel * 100;
}

/**
 * Get XP progress towards next level
 */
export function getXPProgress(totalXP: number, currentLevel: number): {
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
} {
  const currentLevelXP = (currentLevel - 1) * (currentLevel - 1) * 100;
  const nextLevelXP = getXPForNextLevel(currentLevel);
  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  const progress = Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);
  
  return {
    currentLevelXP: xpInCurrentLevel,
    nextLevelXP: xpNeededForLevel,
    progress,
  };
}
