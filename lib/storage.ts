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
  },
});

export const getUserStats = (): UserStats => {
  if (typeof window === 'undefined') return getDefaultUserStats();
  
  const stored = localStorage.getItem(STORAGE_KEYS.USER_STATS);
  if (!stored) return getDefaultUserStats();
  
  try {
    return JSON.parse(stored);
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
  const newBadges: Badge[] = [];
  const existingBadgeIds = stats.badges.map(b => b.id);
  
  const badges: Badge[] = [
    {
      id: 'first_session',
      name: 'First Steps',
      description: 'Complete your first session',
      icon: '🌱',
      rarity: 'common',
    },
    {
      id: 'ten_sessions',
      name: 'Dedicated',
      description: 'Complete 10 sessions',
      icon: '🌿',
      rarity: 'common',
    },
    {
      id: 'hundred_minutes',
      name: 'Centurion',
      description: 'Meditate for 100 minutes',
      icon: '⏱️',
      rarity: 'rare',
    },
    {
      id: 'level_five',
      name: 'Rising Star',
      description: 'Reach level 5',
      icon: '⭐',
      rarity: 'rare',
    },
    {
      id: 'level_ten',
      name: 'Zen Master',
      description: 'Reach level 10',
      icon: '🧘',
      rarity: 'epic',
    },
  ];
  
  badges.forEach(badge => {
    if (existingBadgeIds.includes(badge.id)) return;
    
    let earned = false;
    
    switch (badge.id) {
      case 'first_session':
        earned = stats.sessionsCompleted >= 1;
        break;
      case 'ten_sessions':
        earned = stats.sessionsCompleted >= 10;
        break;
      case 'hundred_minutes':
        earned = stats.totalMinutes >= 100;
        break;
      case 'level_five':
        earned = stats.level >= 5;
        break;
      case 'level_ten':
        earned = stats.level >= 10;
        break;
    }
    
    if (earned) {
      newBadges.push({ ...badge, earnedAt: new Date() });
    }
  });
  
  return newBadges;
};
