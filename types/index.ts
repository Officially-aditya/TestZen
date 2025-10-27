export interface Session {
  id: string;
  mode: SessionMode;
  duration: number;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  xpEarned: number;
  reflectionCID?: string;
  reflectionHash?: string;
}

export type SessionMode = 'meditation' | 'focus' | 'breathwork' | 'calm' | 'gratitude';

export interface UserStats {
  totalXP: number;
  level: number;
  sessionsCompleted: number;
  totalMinutes: number;
  badges: Badge[];
  gardenState: GardenState;
  nftStatus?: NFTStatus;
  walletConnection?: WalletConnection;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'foundation' | 'mode' | 'time' | 'milestone' | 'special';
  color: string;
  requirement: {
    type: string;
    count?: number;
    mode?: string;
    modes?: string[];
    timeOfDay?: 'morning' | 'evening';
    dayType?: 'weekend' | 'weekday';
    xpAmount?: number;
    level?: number;
    wordCount?: number;
  };
  order: number;
}

export interface UserBadge {
  userId?: string;
  badgeId: string;
  earnedAt: Date;
  isNew: boolean;
  progress?: number;
}

export interface GardenState {
  plants: Plant[];
  lastWatered: Date;
  growthLevel: number;
  tiles: GardenTile[];
}

export interface Plant {
  id: string;
  type: string;
  growthStage: number;
  position: { x: number; y: number };
}

export interface GardenTile {
  id: number;
  completed: boolean;
  sessionType?: SessionMode;
  completedAt?: Date;
}

export interface NFTStatus {
  eligible: boolean;
  minted: boolean;
  tokenId?: string;
  tokenURI?: string;
  mintedAt?: Date;
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
}

export interface WalletConnection {
  connected: boolean;
  address?: string;
  accountId?: string;
  chainId?: number;
  network?: string;
  pairingString?: string;
}

export interface HashPackConnectionState {
  accountId: string | null;
  network: string | null;
  topic: string | null;
  pairingString: string | null;
  connected: boolean;
}
