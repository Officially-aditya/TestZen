'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Badge } from '@/types';

interface BadgeCardProps {
  badge: Badge;
  isEarned: boolean;
  progress?: number;
  total?: number;
  isNew?: boolean;
  onClick?: () => void;
  delay?: number;
}

const rarityColors = {
  common: 'from-neutral-400 to-neutral-600',
  rare: 'from-primary-400 to-primary-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-amber-400 to-amber-600',
};

export default function BadgeCard({
  badge,
  isEarned,
  progress = 0,
  total = 1,
  isNew = false,
  onClick,
  delay = 0,
}: BadgeCardProps) {
  const progressPercentage = total > 0 ? Math.min((progress / total) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`
        relative p-3 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer
        ${isEarned
          ? 'border-neutral-200 bg-white shadow-soft hover:shadow-soft-lg'
          : 'border-neutral-200 bg-neutral-50 opacity-70 hover:opacity-80'
        }
      `}
    >
      {isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-success-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-soft z-10"
        >
          New!
        </motion.div>
      )}

      <div className="flex flex-col items-center text-center space-y-2">
        <div
          className={`
            relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl
            ${isEarned
              ? `bg-gradient-to-br ${rarityColors[badge.rarity]} shadow-soft`
              : 'bg-neutral-200'
            }
          `}
          style={isEarned ? { backgroundColor: badge.color + '40' } : {}}
        >
          {isEarned ? (
            <span className={isEarned ? 'animate-pulse-subtle' : ''}>
              {badge.icon}
            </span>
          ) : (
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400" />
          )}
        </div>

        <div className="w-full">
          <p className="font-semibold text-xs sm:text-sm text-neutral-900 truncate">
            {badge.name}
          </p>
          <p className="text-xs text-neutral-600 line-clamp-2 mt-1">
            {badge.description}
          </p>

          {!isEarned && progressPercentage > 0 && (
            <div className="mt-2 w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-neutral-500">
                  {progress}/{total}
                </span>
                <span className="text-xs text-neutral-500">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5, delay: delay + 0.2 }}
                  className="bg-primary-500 h-1.5 rounded-full"
                  style={{ backgroundColor: badge.color }}
                />
              </div>
            </div>
          )}

          {isEarned && (
            <div className="mt-1 space-y-0.5">
              <p className="text-xs text-neutral-500 capitalize">
                {badge.rarity}
              </p>
              {badge.earnedAt && (
                <p className="text-xs text-neutral-400">
                  {new Date(badge.earnedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
