import { Badge } from '@/types';

export const ALL_BADGES: Badge[] = [
  // Foundation Badges (3)
  {
    id: 'first_light',
    name: 'First Light',
    description: 'Complete your first session',
    icon: '🌱',
    rarity: 'common',
    category: 'foundation',
    color: '#A8CABA',
    requirement: {
      type: 'sessions_completed',
      count: 1,
    },
    order: 1,
  },
  {
    id: 'garden_keeper',
    name: 'Garden Keeper',
    description: 'Complete the 3×3 garden grid',
    icon: '🪷',
    rarity: 'rare',
    category: 'foundation',
    color: '#A8CABA',
    requirement: {
      type: 'garden_completed',
      count: 9,
    },
    order: 2,
  },
  {
    id: 'consistent_soul',
    name: 'Consistent Soul',
    description: 'Maintain a 7 day streak',
    icon: '🔥',
    rarity: 'rare',
    category: 'foundation',
    color: '#A8CABA',
    requirement: {
      type: 'streak',
      count: 7,
    },
    order: 3,
  },

  // Session Mode Badges (6)
  {
    id: 'calm_master',
    name: 'Calm Master',
    description: 'Complete 10 Calm sessions',
    icon: '🌸',
    rarity: 'common',
    category: 'mode',
    color: '#F4EDE4',
    requirement: {
      type: 'mode_sessions',
      mode: 'calm',
      count: 10,
    },
    order: 4,
  },
  {
    id: 'focus_champion',
    name: 'Focus Champion',
    description: 'Complete 10 Focus sessions',
    icon: '🎯',
    rarity: 'common',
    category: 'mode',
    color: '#F4EDE4',
    requirement: {
      type: 'mode_sessions',
      mode: 'focus',
      count: 10,
    },
    order: 5,
  },
  {
    id: 'gratitude_guru',
    name: 'Gratitude Guru',
    description: 'Complete 10 Gratitude sessions',
    icon: '🙏',
    rarity: 'common',
    category: 'mode',
    color: '#F4EDE4',
    requirement: {
      type: 'mode_sessions',
      mode: 'gratitude',
      count: 10,
    },
    order: 6,
  },
  {
    id: 'balanced_mind',
    name: 'Balanced Mind',
    description: 'Complete 5 sessions in each mode',
    icon: '⚖️',
    rarity: 'rare',
    category: 'mode',
    color: '#F4EDE4',
    requirement: {
      type: 'balanced_modes',
      count: 5,
      modes: ['calm', 'focus', 'gratitude'],
    },
    order: 7,
  },
  {
    id: 'mode_explorer',
    name: 'Mode Explorer',
    description: 'Try all 3 session modes',
    icon: '🧭',
    rarity: 'common',
    category: 'mode',
    color: '#F4EDE4',
    requirement: {
      type: 'try_all_modes',
      modes: ['calm', 'focus', 'gratitude'],
    },
    order: 8,
  },
  {
    id: 'deep_practice',
    name: 'Deep Practice',
    description: 'Complete 20 total sessions',
    icon: '🍃',
    rarity: 'rare',
    category: 'mode',
    color: '#F4EDE4',
    requirement: {
      type: 'sessions_completed',
      count: 20,
    },
    order: 9,
  },

  // Time-Based Badges (4)
  {
    id: 'morning_zen',
    name: 'Morning Zen',
    description: 'Complete 5 morning sessions (before 10am)',
    icon: '🌅',
    rarity: 'common',
    category: 'time',
    color: '#8FA3BF',
    requirement: {
      type: 'time_of_day',
      timeOfDay: 'morning',
      count: 5,
    },
    order: 10,
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete 5 evening sessions (after 8pm)',
    icon: '🌙',
    rarity: 'common',
    category: 'time',
    color: '#8FA3BF',
    requirement: {
      type: 'time_of_day',
      timeOfDay: 'evening',
      count: 5,
    },
    order: 11,
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete 10 weekend sessions',
    icon: '🎋',
    rarity: 'rare',
    category: 'time',
    color: '#8FA3BF',
    requirement: {
      type: 'day_type',
      dayType: 'weekend',
      count: 10,
    },
    order: 12,
  },
  {
    id: 'weekday_dedicated',
    name: 'Weekday Dedicated',
    description: 'Complete 10 weekday sessions',
    icon: '📅',
    rarity: 'rare',
    category: 'time',
    color: '#8FA3BF',
    requirement: {
      type: 'day_type',
      dayType: 'weekday',
      count: 10,
    },
    order: 13,
  },

  // Milestone Badges (4)
  {
    id: 'xp_novice',
    name: 'XP Novice',
    description: 'Reach 500 XP',
    icon: '⭐',
    rarity: 'common',
    category: 'milestone',
    color: '#D4AF97',
    requirement: {
      type: 'xp_milestone',
      xpAmount: 500,
    },
    order: 14,
  },
  {
    id: 'xp_adept',
    name: 'XP Adept',
    description: 'Reach 1500 XP',
    icon: '✨',
    rarity: 'rare',
    category: 'milestone',
    color: '#D4AF97',
    requirement: {
      type: 'xp_milestone',
      xpAmount: 1500,
    },
    order: 15,
  },
  {
    id: 'xp_master',
    name: 'XP Master',
    description: 'Reach 3000 XP',
    icon: '💫',
    rarity: 'epic',
    category: 'milestone',
    color: '#D4AF97',
    requirement: {
      type: 'xp_milestone',
      xpAmount: 3000,
    },
    order: 16,
  },
  {
    id: 'level_five_sage',
    name: 'Level 5 Sage',
    description: 'Reach level 5',
    icon: '🧘',
    rarity: 'rare',
    category: 'milestone',
    color: '#D4AF97',
    requirement: {
      type: 'level_milestone',
      level: 5,
    },
    order: 17,
  },

  // Special Achievement Badges (3)
  {
    id: 'marathon_meditator',
    name: 'Marathon Meditator',
    description: 'Complete a 15+ minute custom session',
    icon: '🏃',
    rarity: 'epic',
    category: 'special',
    color: '#C5A7C4',
    requirement: {
      type: 'long_session',
      count: 15,
    },
    order: 18,
  },
  {
    id: 'reflection_writer',
    name: 'Reflection Writer',
    description: 'Write 10 reflections over 100 words',
    icon: '✍️',
    rarity: 'rare',
    category: 'special',
    color: '#C5A7C4',
    requirement: {
      type: 'reflections',
      count: 10,
      wordCount: 100,
    },
    order: 19,
  },
  {
    id: 'peace_ambassador',
    name: 'Peace Ambassador',
    description: 'Invite 3 friends (coming soon)',
    icon: '🕊️',
    rarity: 'legendary',
    category: 'special',
    color: '#C5A7C4',
    requirement: {
      type: 'social_invite',
      count: 3,
    },
    order: 20,
  },
];

export const getBadgeById = (id: string): Badge | undefined => {
  return ALL_BADGES.find(badge => badge.id === id);
};

export const getBadgesByCategory = (category: Badge['category']): Badge[] => {
  return ALL_BADGES.filter(badge => badge.category === category);
};

export const getBadgesByRarity = (rarity: Badge['rarity']): Badge[] => {
  return ALL_BADGES.filter(badge => badge.rarity === rarity);
};
