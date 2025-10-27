import { calculateXP, calculateLevel, getXPForNextLevel, getXPProgress } from '@/utils/xp';

describe('XP Utilities', () => {
  describe('calculateXP', () => {
    it('should calculate correct XP for meditation mode', () => {
      expect(calculateXP(10, 'meditation')).toBe(150); // 10 * 10 * 1.5
      expect(calculateXP(20, 'meditation')).toBe(300); // 20 * 10 * 1.5
    });

    it('should calculate correct XP for focus mode', () => {
      expect(calculateXP(10, 'focus')).toBe(120); // 10 * 10 * 1.2
      expect(calculateXP(25, 'focus')).toBe(300); // 25 * 10 * 1.2
    });

    it('should calculate correct XP for breathwork mode', () => {
      expect(calculateXP(10, 'breathwork')).toBe(130); // 10 * 10 * 1.3
      expect(calculateXP(15, 'breathwork')).toBe(195); // 15 * 10 * 1.3
    });

    it('should calculate correct XP for calm mode', () => {
      expect(calculateXP(10, 'calm')).toBe(100); // 10 * 10 * 1.0
      expect(calculateXP(30, 'calm')).toBe(300); // 30 * 10 * 1.0
    });

    it('should calculate correct XP for gratitude mode', () => {
      expect(calculateXP(10, 'gratitude')).toBe(110); // 10 * 10 * 1.1
      expect(calculateXP(20, 'gratitude')).toBe(220); // 20 * 10 * 1.1
    });

    it('should handle fractional results by flooring', () => {
      // gratitude mode: 15 * 10 * 1.1 = 165
      expect(calculateXP(15, 'gratitude')).toBe(165);
    });
  });

  describe('calculateLevel', () => {
    it('should calculate level 1 for 0-99 XP', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(50)).toBe(1);
      expect(calculateLevel(99)).toBe(1);
    });

    it('should calculate level 2 for 100-399 XP', () => {
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(200)).toBe(2);
      expect(calculateLevel(399)).toBe(2);
    });

    it('should calculate level 3 for 400-899 XP', () => {
      expect(calculateLevel(400)).toBe(3);
      expect(calculateLevel(500)).toBe(3);
      expect(calculateLevel(899)).toBe(3);
    });

    it('should calculate level 4 for 900-1599 XP', () => {
      expect(calculateLevel(900)).toBe(4);
      expect(calculateLevel(1000)).toBe(4);
      expect(calculateLevel(1599)).toBe(4);
    });

    it('should calculate level 5 for 1600-2499 XP', () => {
      expect(calculateLevel(1600)).toBe(5);
      expect(calculateLevel(2000)).toBe(5);
      expect(calculateLevel(2499)).toBe(5);
    });

    it('should handle higher levels correctly', () => {
      expect(calculateLevel(2500)).toBe(6);
      expect(calculateLevel(10000)).toBe(11);
    });
  });

  describe('getXPForNextLevel', () => {
    it('should calculate XP required for next level', () => {
      expect(getXPForNextLevel(1)).toBe(100); // Level 2 requires 100 XP
      expect(getXPForNextLevel(2)).toBe(400); // Level 3 requires 400 XP
      expect(getXPForNextLevel(3)).toBe(900); // Level 4 requires 900 XP
      expect(getXPForNextLevel(4)).toBe(1600); // Level 5 requires 1600 XP
      expect(getXPForNextLevel(5)).toBe(2500); // Level 6 requires 2500 XP
    });
  });

  describe('getXPProgress', () => {
    it('should calculate progress correctly at level 1', () => {
      const progress = getXPProgress(50, 1);
      expect(progress.currentLevelXP).toBe(50);
      expect(progress.nextLevelXP).toBe(100);
      expect(progress.progress).toBe(50);
    });

    it('should calculate progress correctly at level 2', () => {
      const progress = getXPProgress(250, 2); // 250 total XP, level 2
      expect(progress.currentLevelXP).toBe(150); // 250 - 100
      expect(progress.nextLevelXP).toBe(300); // 400 - 100
      expect(progress.progress).toBe(50); // 150/300 * 100
    });

    it('should calculate progress correctly at level boundaries', () => {
      const progress = getXPProgress(100, 2); // Just reached level 2
      expect(progress.currentLevelXP).toBe(0);
      expect(progress.nextLevelXP).toBe(300);
      expect(progress.progress).toBe(0);
    });

    it('should cap progress at 100%', () => {
      const progress = getXPProgress(400, 2); // Reached next level
      expect(progress.progress).toBe(100);
    });
  });
});
