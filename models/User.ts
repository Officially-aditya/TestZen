import mongoose, { Schema, Document, Model } from 'mongoose';
import { calculateLevel, getXPForNextLevel, getXPProgress } from '@/utils/xp';

export interface IUser extends Document {
  hederaAccountId: string;
  lastSessionAt?: Date;
  totalXP: number;
  level: number;
  sessionsCompleted: number;
  totalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  calculateCurrentLevel(): number;
  getNextLevelXP(): number;
  getLevelProgress(): {
    currentLevelXP: number;
    nextLevelXP: number;
    progress: number;
  };
}

export interface IUserModel extends Model<IUser> {
  findByHederaAccount(hederaAccountId: string): Promise<IUser | null>;
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

UserSchema.methods.calculateCurrentLevel = function(): number {
  return calculateLevel(this.totalXP);
};

UserSchema.methods.getNextLevelXP = function(): number {
  return getXPForNextLevel(this.level);
};

UserSchema.methods.getLevelProgress = function() {
  return getXPProgress(this.totalXP, this.level);
};

UserSchema.statics.findByHederaAccount = function(hederaAccountId: string) {
  return this.findOne({ hederaAccountId });
};

export const User: IUserModel = 
  (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>('User', UserSchema);
