export interface Session {
  id: string;
  mode: SessionMode;
  duration: number;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  xpEarned: number;
}

export type SessionMode = 'meditation' | 'focus' | 'breathwork';

export interface UserStats {
  totalXP: number;
  level: number;
  sessionsCompleted: number;
  totalMinutes: number;
  badges: Badge[];
  gardenState: GardenState;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface GardenState {
  plants: Plant[];
  lastWatered: Date;
  growthLevel: number;
}

export interface Plant {
  id: string;
  type: string;
  growthStage: number;
  position: { x: number; y: number };
}
