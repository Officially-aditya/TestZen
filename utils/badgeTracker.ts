import { Badge, UserStats, Session } from '@/types';
import { ALL_BADGES } from '@/lib/badges';

interface BadgeProgress {
  badge: Badge;
  progress: number;
  total: number;
  earned: boolean;
}

export const calculateBadgeProgress = (
  badge: Badge,
  stats: UserStats,
  sessions: Session[]
): BadgeProgress => {
  const requirement = badge.requirement;
  let progress = 0;
  let total = requirement.count || 1;

  switch (requirement.type) {
    case 'sessions_completed':
      progress = stats.sessionsCompleted;
      total = requirement.count || 1;
      break;

    case 'garden_completed':
      progress = stats.gardenState.tiles.filter(t => t.completed).length;
      total = requirement.count || 9;
      break;

    case 'streak':
      progress = calculateCurrentStreak(sessions);
      total = requirement.count || 7;
      break;

    case 'mode_sessions':
      progress = countSessionsByMode(sessions, requirement.mode || '');
      total = requirement.count || 10;
      break;

    case 'balanced_modes':
      const modes = requirement.modes || [];
      const minCount = Math.min(
        ...modes.map(mode => countSessionsByMode(sessions, mode))
      );
      progress = minCount;
      total = requirement.count || 5;
      break;

    case 'try_all_modes':
      const triedModes = requirement.modes?.filter(
        mode => countSessionsByMode(sessions, mode) > 0
      ) || [];
      progress = triedModes.length;
      total = requirement.modes?.length || 3;
      break;

    case 'time_of_day':
      progress = countSessionsByTimeOfDay(
        sessions,
        requirement.timeOfDay || 'morning'
      );
      total = requirement.count || 5;
      break;

    case 'day_type':
      progress = countSessionsByDayType(
        sessions,
        requirement.dayType || 'weekend'
      );
      total = requirement.count || 10;
      break;

    case 'xp_milestone':
      progress = stats.totalXP;
      total = requirement.xpAmount || 500;
      break;

    case 'level_milestone':
      progress = stats.level;
      total = requirement.level || 5;
      break;

    case 'long_session':
      progress = countLongSessions(sessions, requirement.count || 15);
      total = 1;
      break;

    case 'reflections':
      progress = countReflections(sessions, requirement.wordCount || 100);
      total = requirement.count || 10;
      break;

    case 'social_invite':
      progress = 0;
      total = requirement.count || 3;
      break;

    default:
      progress = 0;
      total = 1;
  }

  const earned = progress >= total;
  const percentage = Math.min((progress / total) * 100, 100);

  return {
    badge,
    progress,
    total,
    earned,
  };
};

export const checkForNewBadges = (
  stats: UserStats,
  sessions: Session[]
): Badge[] => {
  const earnedBadgeIds = new Set(stats.badges.map(b => b.id));
  const newBadges: Badge[] = [];

  ALL_BADGES.forEach(badge => {
    if (earnedBadgeIds.has(badge.id)) return;

    const { earned } = calculateBadgeProgress(badge, stats, sessions);
    
    if (earned) {
      newBadges.push({
        ...badge,
        earnedAt: new Date(),
      });
    }
  });

  return newBadges;
};

export const getAllBadgesWithProgress = (
  stats: UserStats,
  sessions: Session[]
): BadgeProgress[] => {
  return ALL_BADGES.map(badge => {
    const earnedBadge = stats.badges.find(b => b.id === badge.id);
    const progress = calculateBadgeProgress(badge, stats, sessions);
    
    return {
      ...progress,
      badge: earnedBadge || badge,
      earned: !!earnedBadge,
    };
  });
};

const calculateCurrentStreak = (sessions: Session[]): number => {
  if (sessions.length === 0) return 0;

  const sortedSessions = [...sessions]
    .filter(s => s.completed)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  if (sortedSessions.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecentSession = new Date(sortedSessions[0].startTime);
  mostRecentSession.setHours(0, 0, 0, 0);

  const daysSinceLastSession = Math.floor(
    (today.getTime() - mostRecentSession.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastSession > 1) return 0;

  const uniqueDays = new Set<string>();
  let streak = 0;
  let currentDate = new Date(today);

  for (let i = 0; i < sortedSessions.length; i++) {
    const sessionDate = new Date(sortedSessions[i].startTime);
    sessionDate.setHours(0, 0, 0, 0);
    
    const dateStr = sessionDate.toISOString().split('T')[0];
    
    if (!uniqueDays.has(dateStr)) {
      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - streak);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (sessionDate.getTime() === expectedDate.getTime()) {
        uniqueDays.add(dateStr);
        streak++;
      } else if (sessionDate.getTime() < expectedDate.getTime()) {
        break;
      }
    }
  }

  return streak;
};

const countSessionsByMode = (sessions: Session[], mode: string): number => {
  return sessions.filter(s => s.completed && s.mode === mode).length;
};

const countSessionsByTimeOfDay = (
  sessions: Session[],
  timeOfDay: 'morning' | 'evening'
): number => {
  return sessions.filter(s => {
    if (!s.completed) return false;
    const hour = new Date(s.startTime).getHours();
    if (timeOfDay === 'morning') {
      return hour < 10;
    } else {
      return hour >= 20;
    }
  }).length;
};

const countSessionsByDayType = (
  sessions: Session[],
  dayType: 'weekend' | 'weekday'
): number => {
  return sessions.filter(s => {
    if (!s.completed) return false;
    const day = new Date(s.startTime).getDay();
    const isWeekend = day === 0 || day === 6;
    return dayType === 'weekend' ? isWeekend : !isWeekend;
  }).length;
};

const countLongSessions = (sessions: Session[], minDuration: number): number => {
  return sessions.filter(s => s.completed && s.duration >= minDuration).length > 0
    ? 1
    : 0;
};

const countReflections = (sessions: Session[], minWords: number): number => {
  return 0;
};
