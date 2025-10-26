import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGardenTile {
  id: number;
  completed: boolean;
  sessionType?: string;
  completedAt?: Date;
}

export interface INFTMetadata {
  tokenId?: string;
  serialNumber?: string;
  cid?: string;
  transactionId?: string;
  mintedAt?: Date;
  level: number;
  totalXP: number;
  completionDate: Date;
  reflectionHash?: string;
}

export interface IGarden extends Document {
  userId: string;
  walletAddress: string;
  tiles: IGardenTile[];
  nftMinted: boolean;
  nftMetadata?: INFTMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const GardenTileSchema = new Schema({
  id: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  sessionType: { type: String },
  completedAt: { type: Date },
});

const NFTMetadataSchema = new Schema({
  tokenId: { type: String },
  serialNumber: { type: String },
  cid: { type: String },
  transactionId: { type: String },
  mintedAt: { type: Date },
  level: { type: Number, required: true },
  totalXP: { type: Number, required: true },
  completionDate: { type: Date, required: true },
  reflectionHash: { type: String },
});

const GardenSchema = new Schema<IGarden>(
  {
    userId: { type: String, required: true, index: true },
    walletAddress: { type: String, required: true, index: true },
    tiles: { type: [GardenTileSchema], required: true },
    nftMinted: { type: Boolean, default: false },
    nftMetadata: { type: NFTMetadataSchema },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
GardenSchema.index({ userId: 1, walletAddress: 1 }, { unique: true });

export const Garden: Model<IGarden> = 
  mongoose.models.Garden || mongoose.model<IGarden>('Garden', GardenSchema);
