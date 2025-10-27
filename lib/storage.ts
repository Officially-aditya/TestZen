import { UserStats, Session, Badge } from '@/types';

const STORAGE_KEYS = {
  USER_STATS: 'testzen_user_stats',
  SESSIONS: 'testzen_sessions',
} as const;

export const getDefaultUserStats = (): UserStats => ({
  totalXP: 0,
  level: 1,
  sessionsCompleted: 0,
  totalMinutes: 0,
  badges: [],
  gardenState: {
    plants: [],
    lastWatered: new Date(),
    growthLevel: 0,
    tiles: Array.from({ length: 9 }, (_, i) => ({
      id: i,
      completed: false,
    })),
  },
  nftStatus: {
    eligible: false,
    minted: false,
  },
  walletConnection: {
    connected: false,
  },
});

const migrateBadges = (badges: any[]): any[] => {
  const badgeIdMap: Record<string, string> = {
    'first_session': 'first_light',
    'ten_sessions': 'deep_practice',
    'hundred_minutes': 'xp_novice',
    'level_five': 'level_five_sage',
    'level_ten': 'xp_adept',
  };
  
  return badges.map(badge => {
    if (badgeIdMap[badge.id]) {
      return {
        ...badge,
        id: badgeIdMap[badge.id],
      };
    }
    return badge;
  });
};

export const getUserStats = (): UserStats => {
  if (typeof window === 'undefined') return getDefaultUserStats();
  
  const stored = localStorage.getItem(STORAGE_KEYS.USER_STATS);
  if (!stored) return getDefaultUserStats();
  
  try {
    const stats = JSON.parse(stored);
    if (stats.badges && Array.isArray(stats.badges)) {
      stats.badges = migrateBadges(stats.badges);
    }
    return stats;
  } catch {
    return getDefaultUserStats();
  }
};

export const saveUserStats = (stats: UserStats): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
};

export const getSessions = (): Session[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveSessions = (sessions: Session[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
};

export const addSession = (session: Session): void => {
  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);
};

export const calculateXP = (durationMinutes: number, mode: string): number => {
  const baseXP = durationMinutes * 10;
  const modeMultiplier = mode === 'meditation' ? 1.2 : mode === 'breathwork' ? 1.1 : 1;
  return Math.floor(baseXP * modeMultiplier);
};

export const calculateLevel = (totalXP: number): number => {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
};

export const getXPForNextLevel = (currentLevel: number): number => {
  return Math.pow(currentLevel, 2) * 100;
};

export const checkForNewBadges = (stats: UserStats): Badge[] => {
  const sessions = getSessions();
  const { checkForNewBadges: checkBadges } = require('@/utils/badgeTracker');
  return checkBadges(stats, sessions);
};

export const updateGardenTiles = (stats: UserStats): UserStats => {
  const completedTiles = Math.floor(stats.sessionsCompleted / 3);
  const tiles = stats.gardenState.tiles.map((tile, index) => {
    if (index < completedTiles) {
      return { ...tile, completed: true };
    }
    return tile;
  });
  
  return {
    ...stats,
    gardenState: {
      ...stats.gardenState,
      tiles,
    },
  };
};

export const checkNFTEligibility = (stats: UserStats): boolean => {
  const allTilesCompleted = stats.gardenState.tiles.every(tile => tile.completed);
  return allTilesCompleted && stats.sessionsCompleted >= 9;
};

export const updateNFTStatus = (stats: UserStats): UserStats => {
  const eligible = checkNFTEligibility(stats);
  return {
    ...stats,
    nftStatus: {
      ...stats.nftStatus,
      eligible,
      minted: stats.nftStatus?.minted || false,
    },
  };
};
