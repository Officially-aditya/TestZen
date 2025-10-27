import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  hederaAccountId: string;
  lastSessionAt?: Date;
  totalXP: number;
  level: number;
  sessionsCompleted: number;
  totalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    hederaAccountId: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    lastSessionAt: { type: Date },
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    sessionsCompleted: { type: Number, default: 0 },
    totalMinutes: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> = 
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
