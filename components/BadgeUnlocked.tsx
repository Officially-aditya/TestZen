'use client';

import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { Badge } from '@/types';

interface BadgeUnlockedProps {
  badges: Badge[];
  onClose: () => void;
}

const rarityColors = {
  common: 'from-neutral-400 to-neutral-600',
  rare: 'from-primary-400 to-primary-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-amber-400 to-amber-600',
};

export default function BadgeUnlocked({ badges, onClose }: BadgeUnlockedProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="flex flex-col items-center space-y-6 p-6 sm:p-8"
    >
      <motion.div
        initial={{ rotate: -180, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center shadow-soft-lg">
          <Award className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </div>
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full bg-success-400"
        />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
          Badge{badges.length > 1 ? 's' : ''} Unlocked!
        </h2>
        <p className="text-neutral-600 text-sm sm:text-base">
          You&apos;ve earned {badges.length} new badge{badges.length > 1 ? 's' : ''}
        </p>
      </motion.div>

      <div className="w-full space-y-3">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="p-4 sm:p-6 rounded-2xl bg-white border-2 border-neutral-200 shadow-soft"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${rarityColors[badge.rarity]} flex items-center justify-center text-2xl sm:text-3xl shadow-soft`}
              >
                {badge.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg text-neutral-900 truncate">
                  {badge.name}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2">
                  {badge.description}
                </p>
                <p className="text-xs text-neutral-500 mt-1 capitalize">
                  {badge.rarity}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onClose}
        className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-primary-500 text-white font-semibold shadow-soft hover:bg-primary-600 transition-colors focus-ring"
      >
        Continue
      </motion.button>
    </motion.div>
  );
}
