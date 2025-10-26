'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/types';
import { Lock } from 'lucide-react';

interface BadgeGridProps {
  badges: Badge[];
  earnedBadges: Badge[];
}

const rarityColors = {
  common: 'from-neutral-400 to-neutral-600',
  rare: 'from-primary-400 to-primary-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-amber-400 to-amber-600',
};

export default function BadgeGrid({ badges, earnedBadges }: BadgeGridProps) {
  const earnedIds = new Set(earnedBadges.map(b => b.id));

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-neutral-200 shadow-soft"
    >
      <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4">
        Badges Collection
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {badges.map((badge, index) => {
          const isEarned = earnedIds.has(badge.id);

          return (
            <motion.div
              key={badge.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`
                p-3 sm:p-4 rounded-2xl border-2 transition-all
                ${isEarned
                  ? 'border-neutral-200 bg-white shadow-soft hover:shadow-soft-lg'
                  : 'border-neutral-200 bg-neutral-50 opacity-60'
                }
              `}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div
                  className={`
                    w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl shadow-soft
                    ${isEarned
                      ? `bg-gradient-to-br ${rarityColors[badge.rarity]}`
                      : 'bg-neutral-200'
                    }
                  `}
                >
                  {isEarned ? badge.icon : <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400" />}
                </div>
                <div className="w-full">
                  <p className="font-semibold text-xs sm:text-sm text-neutral-900 truncate">
                    {badge.name}
                  </p>
                  <p className="text-xs text-neutral-600 line-clamp-2 mt-1">
                    {badge.description}
                  </p>
                  {isEarned && (
                    <p className="text-xs text-neutral-500 mt-1 capitalize">
                      {badge.rarity}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
