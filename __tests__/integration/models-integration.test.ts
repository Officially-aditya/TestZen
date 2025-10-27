import mongoose from 'mongoose';
import { User } from '@/models/User';
import { SessionModel } from '@/models/Session';
import { Garden } from '@/models/Garden';
import { calculateXP, updateUserXP } from '@/utils/xp';
import { initializeGarden, updateGardenProgression } from '@/utils/garden';

describe('Models Integration Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/testzen-test');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await SessionModel.deleteMany({});
    await Garden.deleteMany({});
  });

  describe('Complete User Journey', () => {
    it('should handle a complete user session lifecycle', async () => {
      const hederaAccountId = '0.0.123456';
      
      const user = await User.create({
        hederaAccountId,
        totalXP: 0,
        level: 1,
        sessionsCompleted: 0,
        totalMinutes: 0,
      });

      const garden = await Garden.create({
        userId: String(user._id),
        walletAddress: hederaAccountId,
        tiles: initializeGarden(),
        nftMinted: false,
      });

      expect(user).toBeDefined();
      expect(garden).toBeDefined();
      expect(garden.tiles).toHaveLength(9);
      expect(garden.tiles.every(t => !t.completed)).toBe(true);
    });

    it('should complete a session and update user XP and level', async () => {
      const hederaAccountId = '0.0.234567';
      
      const user = await User.create({
        hederaAccountId,
        totalXP: 90,
        level: 1,
        sessionsCompleted: 5,
        totalMinutes: 50,
      });

      const sessionMode = 'meditation';
      const duration = 10;
      const xpEarned = calculateXP(duration, sessionMode);

      expect(xpEarned).toBe(150); // 10 * 10 * 1.5

      const session = await SessionModel.create({
        userId: String(user._id),
        hederaAccountId,
        mode: sessionMode,
        duration,
        startTime: new Date(),
        completed: true,
        xpEarned,
        nonce: 'test-nonce-123',
      });

      const xpUpdate = updateUserXP(user.totalXP, user.level, xpEarned);

      user.totalXP = xpUpdate.newTotalXP;
      user.level = xpUpdate.newLevel;
      user.sessionsCompleted += 1;
      user.totalMinutes += duration;
      user.lastSessionAt = new Date();

      await user.save();

      expect(user.totalXP).toBe(240);
      expect(user.level).toBe(2); // Leveled up!
      expect(xpUpdate.leveledUp).toBe(true);
      expect(user.sessionsCompleted).toBe(6);
      expect(user.totalMinutes).toBe(60);
      expect(session.xpEarned).toBe(150);
    });

    it('should update garden progression after session completion', async () => {
      const hederaAccountId = '0.0.345678';
      
      const user = await User.create({
        hederaAccountId,
        totalXP: 0,
        level: 1,
      });

      const garden = await Garden.create({
        userId: String(user._id),
        walletAddress: hederaAccountId,
        tiles: initializeGarden(),
        nftMinted: false,
      });

      const sessionMode = 'focus';
      const result = updateGardenProgression(garden.tiles, sessionMode);

      garden.tiles = result.tiles;
      await garden.save();

      const updatedGarden = await Garden.findById(String(garden._id));

      expect(updatedGarden?.tiles[0].completed).toBe(true);
      expect(updatedGarden?.tiles[0].sessionType).toBe('focus');
      expect(result.nextTileId).toBe(1);
      expect(result.isGridComplete).toBe(false);
    });

    it('should complete entire garden progression', async () => {
      const hederaAccountId = '0.0.456789';
      
      const user = await User.create({
        hederaAccountId,
        totalXP: 0,
        level: 1,
      });

      let garden = await Garden.create({
        userId: String(user._id),
        walletAddress: hederaAccountId,
        tiles: initializeGarden(),
        nftMinted: false,
      });

      const sessionModes = ['meditation', 'focus', 'breathwork', 'calm', 'gratitude', 'meditation', 'focus', 'breathwork', 'calm'];

      for (let i = 0; i < 9; i++) {
        const mode = sessionModes[i] as any;
        const duration = 10;
        const xpEarned = calculateXP(duration, mode);

        await SessionModel.create({
          userId: String(user._id),
          hederaAccountId,
          mode,
          duration,
          startTime: new Date(),
          completed: true,
          xpEarned,
          nonce: `test-nonce-${i}`,
        });

        const xpUpdate = updateUserXP(user.totalXP, user.level, xpEarned);
        user.totalXP = xpUpdate.newTotalXP;
        user.level = xpUpdate.newLevel;
        user.sessionsCompleted += 1;
        user.totalMinutes += duration;
        user.lastSessionAt = new Date();

        const result = updateGardenProgression(garden.tiles, mode);
        garden.tiles = result.tiles;

        if (result.isGridComplete) {
          garden.nftMetadata = {
            level: user.level,
            totalXP: user.totalXP,
            completionDate: result.completionDate || new Date(),
          };
        }
      }

      await user.save();
      await garden.save();

      const finalUser = await User.findById(user._id);
      const finalGarden = await Garden.findById(String(garden._id));

      expect(finalUser?.sessionsCompleted).toBe(9);
      expect(finalUser?.totalMinutes).toBe(90);
      expect(finalGarden?.tiles.every(t => t.completed)).toBe(true);
      expect(finalGarden?.nftMetadata).toBeDefined();
      expect(finalGarden?.nftMetadata?.level).toBeDefined();
      expect(finalGarden?.nftMetadata?.totalXP).toBeDefined();
    });
  });

  describe('User Methods Integration', () => {
    it('should use user instance methods correctly', async () => {
      const user = await User.create({
        hederaAccountId: '0.0.567890',
        totalXP: 250,
        level: 2,
      });

      const calculatedLevel = user.calculateCurrentLevel();
      expect(calculatedLevel).toBe(2);

      const nextLevelXP = user.getNextLevelXP();
      expect(nextLevelXP).toBe(400);

      const progress = user.getLevelProgress();
      expect(progress.currentLevelXP).toBe(150);
      expect(progress.nextLevelXP).toBe(300);
      expect(progress.progress).toBe(50);
    });

    it('should find user by Hedera account using static method', async () => {
      await User.create({
        hederaAccountId: '0.0.678901',
        totalXP: 500,
        level: 3,
      });

      const foundUser = await User.findByHederaAccount('0.0.678901');

      expect(foundUser).toBeDefined();
      expect(foundUser?.hederaAccountId).toBe('0.0.678901');
      expect(foundUser?.totalXP).toBe(500);
    });
  });

  describe('Session XP Calculation', () => {
    it('should calculate correct XP for all session modes', async () => {
      const modes = [
        { mode: 'meditation', multiplier: 1.5 },
        { mode: 'focus', multiplier: 1.2 },
        { mode: 'breathwork', multiplier: 1.3 },
        { mode: 'calm', multiplier: 1.0 },
        { mode: 'gratitude', multiplier: 1.1 },
      ];

      const duration = 10;
      const baseXP = 100;

      for (const { mode, multiplier } of modes) {
        const xp = calculateXP(duration, mode as any);
        expect(xp).toBe(Math.floor(baseXP * multiplier));
      }
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity between models', async () => {
      const hederaAccountId = '0.0.789012';
      
      const user = await User.create({
        hederaAccountId,
        totalXP: 100,
        level: 2,
      });

      const session = await SessionModel.create({
        userId: String(user._id),
        hederaAccountId,
        mode: 'meditation',
        duration: 15,
        startTime: new Date(),
        completed: true,
        xpEarned: 150,
        nonce: 'consistency-test-nonce',
      });

      const garden = await Garden.create({
        userId: String(user._id),
        walletAddress: hederaAccountId,
        tiles: initializeGarden(),
        nftMinted: false,
      });

      const foundUser = await User.findById(user._id);
      const foundSession = await SessionModel.findOne({ userId: String(user._id) });
      const foundGarden = await Garden.findOne({ userId: String(user._id) });

      expect(String(foundUser?._id)).toBe(String(user._id));
      expect(foundSession?.userId).toBe(String(user._id));
      expect(foundGarden?.userId).toBe(String(user._id));
    });

    it('should handle multiple sessions for same user', async () => {
      const hederaAccountId = '0.0.890123';
      
      const user = await User.create({
        hederaAccountId,
        totalXP: 0,
        level: 1,
      });

      const sessionCount = 5;
      for (let i = 0; i < sessionCount; i++) {
        await SessionModel.create({
          userId: String(user._id),
          hederaAccountId,
          mode: 'meditation',
          duration: 10,
          startTime: new Date(),
          completed: true,
          xpEarned: 150,
          nonce: `multi-session-nonce-${i}`,
        });
      }

      const sessions = await SessionModel.find({ userId: String(user._id) });
      expect(sessions).toHaveLength(sessionCount);
      expect(sessions.every(s => s.completed)).toBe(true);
    });
  });
});
