import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEncryptedReflection {
  ciphertext: string;
  iv: string;
  salt: string;
  hash: string; // SHA-256 hash of ciphertext for integrity verification
  cid?: string; // IPFS CID of the uploaded encrypted reflection
}

export interface ISession extends Document {
  userId: string;
  hederaAccountId: string;
  walletAddress?: string;
  mode: string; // 'meditation' | 'focus' | 'breathwork'
  duration: number; // in minutes
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  xpEarned: number;
  nonce: string; // For replay attack prevention
  hcsTopicId?: string;
  hcsSequenceNumber?: number;
  hcsConsensusTimestamp?: Date;
  signedProof?: string; // Signed proof payload
  encryptedReflection?: IEncryptedReflection;
  createdAt: Date;
  updatedAt: Date;
}

const EncryptedReflectionSchema = new Schema({
  ciphertext: { type: String, required: true },
  iv: { type: String, required: true },
  salt: { type: String, required: true },
  hash: { type: String, required: true },
  cid: { type: String },
});

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: String, required: true, index: true },
    hederaAccountId: { type: String, required: true, index: true },
    walletAddress: { type: String, index: true },
    mode: { type: String, required: true, enum: ['meditation', 'focus', 'breathwork', 'calm', 'gratitude'] },
    duration: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    completed: { type: Boolean, default: false },
    xpEarned: { type: Number, default: 0 },
    nonce: { type: String, required: true, unique: true },
    hcsTopicId: { type: String },
    hcsSequenceNumber: { type: Number },
    hcsConsensusTimestamp: { type: Date },
    signedProof: { type: String },
    encryptedReflection: { type: EncryptedReflectionSchema },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
SessionSchema.index({ userId: 1, completed: 1 });
SessionSchema.index({ walletAddress: 1, completed: 1 });

export const SessionModel: Model<ISession> = 
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
