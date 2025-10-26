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
  walletAddress?: string;
  mode: string; // 'meditation' | 'focus' | 'breathwork'
  duration: number; // in minutes
  startTime: Date;
  endTime: Date;
  completed: boolean;
  xpEarned: number;
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
    walletAddress: { type: String, index: true },
    mode: { type: String, required: true, enum: ['meditation', 'focus', 'breathwork'] },
    duration: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    xpEarned: { type: Number, required: true },
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
