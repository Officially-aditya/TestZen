import mongoose from 'mongoose';
import { SessionModel, ISession } from '@/models/Session';

describe('Session Model', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/testzen-test');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await SessionModel.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a session with valid data', async () => {
      const sessionData = {
        userId: 'user123',
        hederaAccountId: '0.0.12345',
        mode: 'meditation',
        duration: 15,
        startTime: new Date(),
        completed: true,
        xpEarned: 150,
        nonce: 'unique-nonce-123',
      };

      const session = new SessionModel(sessionData);
      const savedSession = await session.save();

      expect(savedSession._id).toBeDefined();
      expect(savedSession.userId).toBe('user123');
      expect(savedSession.hederaAccountId).toBe('0.0.12345');
      expect(savedSession.mode).toBe('meditation');
      expect(savedSession.duration).toBe(15);
      expect(savedSession.completed).toBe(true);
      expect(savedSession.xpEarned).toBe(150);
      expect(savedSession.createdAt).toBeDefined();
      expect(savedSession.updatedAt).toBeDefined();
    });

    it('should apply default values correctly', async () => {
      const session = new SessionModel({
        userId: 'user456',
        hederaAccountId: '0.0.67890',
        mode: 'focus',
        duration: 20,
        startTime: new Date(),
        nonce: 'unique-nonce-456',
      });

      const savedSession = await session.save();

      expect(savedSession.completed).toBe(false);
      expect(savedSession.xpEarned).toBe(0);
    });

    it('should validate session mode enum', async () => {
      const session = new SessionModel({
        userId: 'user789',
        hederaAccountId: '0.0.11111',
        mode: 'calm',
        duration: 10,
        startTime: new Date(),
        nonce: 'unique-nonce-789',
      });

      const savedSession = await session.save();
      expect(savedSession.mode).toBe('calm');
    });

    it('should support all valid session modes', async () => {
      const modes = ['meditation', 'focus', 'breathwork', 'calm', 'gratitude'];
      
      for (let i = 0; i < modes.length; i++) {
        const session = new SessionModel({
          userId: `user${i}`,
          hederaAccountId: `0.0.${10000 + i}`,
          mode: modes[i],
          duration: 10,
          startTime: new Date(),
          nonce: `unique-nonce-${i}`,
        });

        const savedSession = await session.save();
        expect(savedSession.mode).toBe(modes[i]);
      }
    });

    it('should require userId', async () => {
      const session = new SessionModel({
        hederaAccountId: '0.0.22222',
        mode: 'meditation',
        duration: 15,
        startTime: new Date(),
        nonce: 'unique-nonce-test',
      });

      await expect(session.save()).rejects.toThrow();
    });

    it('should require hederaAccountId', async () => {
      const session = new SessionModel({
        userId: 'user999',
        mode: 'meditation',
        duration: 15,
        startTime: new Date(),
        nonce: 'unique-nonce-test2',
      });

      await expect(session.save()).rejects.toThrow();
    });

    it('should require mode', async () => {
      const session = new SessionModel({
        userId: 'user888',
        hederaAccountId: '0.0.33333',
        duration: 15,
        startTime: new Date(),
        nonce: 'unique-nonce-test3',
      });

      await expect(session.save()).rejects.toThrow();
    });

    it('should require duration', async () => {
      const session = new SessionModel({
        userId: 'user777',
        hederaAccountId: '0.0.44444',
        mode: 'focus',
        startTime: new Date(),
        nonce: 'unique-nonce-test4',
      });

      await expect(session.save()).rejects.toThrow();
    });

    it('should require nonce and enforce uniqueness', async () => {
      const session1 = new SessionModel({
        userId: 'user666',
        hederaAccountId: '0.0.55555',
        mode: 'breathwork',
        duration: 10,
        startTime: new Date(),
        nonce: 'duplicate-nonce',
      });
      await session1.save();

      const session2 = new SessionModel({
        userId: 'user555',
        hederaAccountId: '0.0.66666',
        mode: 'calm',
        duration: 10,
        startTime: new Date(),
        nonce: 'duplicate-nonce',
      });

      await expect(session2.save()).rejects.toThrow();
    });
  });

  describe('HCS Metadata Fields', () => {
    it('should store HCS metadata correctly', async () => {
      const consensusTimestamp = new Date();
      const session = new SessionModel({
        userId: 'user111',
        hederaAccountId: '0.0.77777',
        mode: 'gratitude',
        duration: 5,
        startTime: new Date(),
        nonce: 'hcs-nonce-1',
        hcsTopicId: '0.0.123456',
        hcsSequenceNumber: 42,
        hcsConsensusTimestamp: consensusTimestamp,
      });

      const savedSession = await session.save();

      expect(savedSession.hcsTopicId).toBe('0.0.123456');
      expect(savedSession.hcsSequenceNumber).toBe(42);
      expect(savedSession.hcsConsensusTimestamp?.getTime()).toBe(consensusTimestamp.getTime());
    });

    it('should handle optional HCS fields', async () => {
      const session = new SessionModel({
        userId: 'user222',
        hederaAccountId: '0.0.88888',
        mode: 'meditation',
        duration: 10,
        startTime: new Date(),
        nonce: 'hcs-nonce-2',
      });

      const savedSession = await session.save();

      expect(savedSession.hcsTopicId).toBeUndefined();
      expect(savedSession.hcsSequenceNumber).toBeUndefined();
      expect(savedSession.hcsConsensusTimestamp).toBeUndefined();
    });
  });

  describe('Encrypted Reflection', () => {
    it('should store encrypted reflection with CID', async () => {
      const session = new SessionModel({
        userId: 'user333',
        hederaAccountId: '0.0.99999',
        mode: 'focus',
        duration: 15,
        startTime: new Date(),
        nonce: 'reflection-nonce-1',
        encryptedReflection: {
          ciphertext: 'encrypted-data-here',
          iv: 'initialization-vector',
          salt: 'random-salt',
          hash: 'sha256-hash',
          cid: 'QmTest123456789',
        },
      });

      const savedSession = await session.save();

      expect(savedSession.encryptedReflection).toBeDefined();
      expect(savedSession.encryptedReflection?.ciphertext).toBe('encrypted-data-here');
      expect(savedSession.encryptedReflection?.iv).toBe('initialization-vector');
      expect(savedSession.encryptedReflection?.salt).toBe('random-salt');
      expect(savedSession.encryptedReflection?.hash).toBe('sha256-hash');
      expect(savedSession.encryptedReflection?.cid).toBe('QmTest123456789');
    });

    it('should handle reflection without CID', async () => {
      const session = new SessionModel({
        userId: 'user444',
        hederaAccountId: '0.0.10101',
        mode: 'breathwork',
        duration: 12,
        startTime: new Date(),
        nonce: 'reflection-nonce-2',
        encryptedReflection: {
          ciphertext: 'another-encrypted-data',
          iv: 'another-iv',
          salt: 'another-salt',
          hash: 'another-hash',
        },
      });

      const savedSession = await session.save();

      expect(savedSession.encryptedReflection).toBeDefined();
      expect(savedSession.encryptedReflection?.cid).toBeUndefined();
    });
  });

  describe('Optional Fields', () => {
    it('should handle optional walletAddress', async () => {
      const session = new SessionModel({
        userId: 'user555',
        hederaAccountId: '0.0.20202',
        walletAddress: '0x1234567890abcdef',
        mode: 'calm',
        duration: 8,
        startTime: new Date(),
        nonce: 'wallet-nonce-1',
      });

      const savedSession = await session.save();

      expect(savedSession.walletAddress).toBe('0x1234567890abcdef');
    });

    it('should handle optional endTime', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 600000); // 10 minutes later

      const session = new SessionModel({
        userId: 'user666',
        hederaAccountId: '0.0.30303',
        mode: 'gratitude',
        duration: 10,
        startTime,
        endTime,
        nonce: 'endtime-nonce-1',
      });

      const savedSession = await session.save();

      expect(savedSession.endTime?.getTime()).toBe(endTime.getTime());
    });

    it('should handle optional signedProof', async () => {
      const session = new SessionModel({
        userId: 'user777',
        hederaAccountId: '0.0.40404',
        mode: 'meditation',
        duration: 20,
        startTime: new Date(),
        signedProof: 'signed-proof-data',
        nonce: 'proof-nonce-1',
      });

      const savedSession = await session.save();

      expect(savedSession.signedProof).toBe('signed-proof-data');
    });
  });

  describe('Indexes', () => {
    it('should create compound indexes for efficient queries', async () => {
      const indexes = SessionModel.schema.indexes();
      
      const hasUserCompletedIndex = indexes.some(
        (index) => JSON.stringify(index[0]) === JSON.stringify({ userId: 1, completed: 1 })
      );
      
      const hasWalletCompletedIndex = indexes.some(
        (index) => JSON.stringify(index[0]) === JSON.stringify({ walletAddress: 1, completed: 1 })
      );

      expect(hasUserCompletedIndex).toBe(true);
      expect(hasWalletCompletedIndex).toBe(true);
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      const session = new SessionModel({
        userId: 'user888',
        hederaAccountId: '0.0.50505',
        mode: 'focus',
        duration: 15,
        startTime: new Date(),
        nonce: 'timestamp-nonce-1',
      });

      const savedSession = await session.save();

      expect(savedSession.createdAt).toBeDefined();
      expect(savedSession.updatedAt).toBeDefined();
    });

    it('should update updatedAt on modification', async () => {
      const session = new SessionModel({
        userId: 'user999',
        hederaAccountId: '0.0.60606',
        mode: 'meditation',
        duration: 10,
        startTime: new Date(),
        nonce: 'timestamp-nonce-2',
      });

      const savedSession = await session.save();
      const originalUpdatedAt = savedSession.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      savedSession.completed = true;
      savedSession.xpEarned = 100;
      await savedSession.save();

      expect(savedSession.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
