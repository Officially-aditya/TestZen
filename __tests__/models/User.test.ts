import mongoose from 'mongoose';
import { User, IUser } from '@/models/User';

describe('User Model', () => {
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
  });

  describe('Schema Validation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        hederaAccountId: '0.0.12345',
        totalXP: 100,
        level: 2,
        sessionsCompleted: 5,
        totalMinutes: 50,
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.hederaAccountId).toBe('0.0.12345');
      expect(savedUser.totalXP).toBe(100);
      expect(savedUser.level).toBe(2);
      expect(savedUser.sessionsCompleted).toBe(5);
      expect(savedUser.totalMinutes).toBe(50);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should apply default values correctly', async () => {
      const user = new User({
        hederaAccountId: '0.0.67890',
      });

      const savedUser = await user.save();

      expect(savedUser.totalXP).toBe(0);
      expect(savedUser.level).toBe(1);
      expect(savedUser.sessionsCompleted).toBe(0);
      expect(savedUser.totalMinutes).toBe(0);
    });

    it('should require hederaAccountId', async () => {
      const user = new User({
        totalXP: 100,
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique hederaAccountId', async () => {
      const user1 = new User({
        hederaAccountId: '0.0.99999',
      });
      await user1.save();

      const user2 = new User({
        hederaAccountId: '0.0.99999',
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should handle optional lastSessionAt field', async () => {
      const sessionDate = new Date();
      const user = new User({
        hederaAccountId: '0.0.11111',
        lastSessionAt: sessionDate,
      });

      const savedUser = await user.save();

      expect(savedUser.lastSessionAt).toBeDefined();
      expect(savedUser.lastSessionAt?.getTime()).toBe(sessionDate.getTime());
    });
  });

  describe('Instance Methods', () => {
    let user: IUser;

    beforeEach(async () => {
      user = new User({
        hederaAccountId: '0.0.55555',
        totalXP: 250,
        level: 2,
      });
      await user.save();
    });

    it('should calculate current level from total XP', () => {
      expect(user.calculateCurrentLevel()).toBe(2);
    });

    it('should get next level XP requirement', () => {
      expect(user.getNextLevelXP()).toBe(400); // Level 3 requires 400 XP
    });

    it('should get level progress', () => {
      const progress = user.getLevelProgress();
      
      expect(progress.currentLevelXP).toBe(150); // 250 - 100
      expect(progress.nextLevelXP).toBe(300); // 400 - 100
      expect(progress.progress).toBe(50); // 150/300 * 100
    });

    it('should recalculate level after XP update', async () => {
      user.totalXP = 500;
      const newLevel = user.calculateCurrentLevel();
      
      expect(newLevel).toBe(3);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await User.create([
        { hederaAccountId: '0.0.11111', totalXP: 100 },
        { hederaAccountId: '0.0.22222', totalXP: 200 },
        { hederaAccountId: '0.0.33333', totalXP: 300 },
      ]);
    });

    it('should find user by Hedera account ID', async () => {
      const user = await User.findByHederaAccount('0.0.22222');
      
      expect(user).toBeDefined();
      expect(user?.hederaAccountId).toBe('0.0.22222');
      expect(user?.totalXP).toBe(200);
    });

    it('should return null for non-existent account', async () => {
      const user = await User.findByHederaAccount('0.0.99999');
      
      expect(user).toBeNull();
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      const user = new User({
        hederaAccountId: '0.0.77777',
      });

      const savedUser = await user.save();

      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
      expect(savedUser.createdAt.getTime()).toBeLessThanOrEqual(savedUser.updatedAt.getTime());
    });

    it('should update updatedAt on modification', async () => {
      const user = new User({
        hederaAccountId: '0.0.88888',
        totalXP: 0,
      });

      const savedUser = await user.save();
      const originalUpdatedAt = savedUser.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      savedUser.totalXP = 100;
      await savedUser.save();

      expect(savedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
