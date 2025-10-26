'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { getXPForNextLevel } from '@/lib/storage';

interface XPBarProps {
  totalXP: number;
  level: number;
}

export default function XPBar({ totalXP, level }: XPBarProps) {
  const currentLevelXP = Math.pow(level - 1, 2) * 100;
  const nextLevelXP = getXPForNextLevel(level);
  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  const progressPercentage = Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Level {level}
          </h2>
          <p className="text-sm text-neutral-600">
            {totalXP.toLocaleString()} Total XP
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Progress to Level {level + 1}</span>
          <span className="font-semibold text-neutral-900">
            {xpInCurrentLevel} / {xpNeededForLevel} XP
          </span>
        </div>

        <div className="relative h-4 bg-neutral-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-success-500 rounded-full"
          />
          
          <motion.div
            animate={{
              x: ['0%', '200%'],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </div>

        <p className="text-xs text-neutral-500 text-center mt-3">
          {xpNeededForLevel - xpInCurrentLevel} XP needed for next level
        </p>
      </div>
    </div>
  );
}
