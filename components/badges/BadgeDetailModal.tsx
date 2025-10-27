'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle } from 'lucide-react';
import { Badge } from '@/types';

interface BadgeDetailModalProps {
  badge: Badge | null;
  isEarned: boolean;
  progress?: number;
  total?: number;
  isOpen: boolean;
  onClose: () => void;
}

const rarityColors = {
  common: 'from-neutral-400 to-neutral-600',
  rare: 'from-primary-400 to-primary-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-amber-400 to-amber-600',
};

const categoryLabels = {
  foundation: 'Foundation',
  mode: 'Session Mode',
  time: 'Time-Based',
  milestone: 'Milestone',
  special: 'Special Achievement',
};

export default function BadgeDetailModal({
  badge,
  isEarned,
  progress = 0,
  total = 1,
  isOpen,
  onClose,
}: BadgeDetailModalProps) {
  if (!badge) return null;

  const progressPercentage = total > 0 ? Math.min((progress / total) * 100, 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-3xl shadow-soft-lg max-w-md w-full p-6 sm:p-8 z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-neutral-100 transition-colors focus-ring"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>

            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div
                  className={`
                    w-24 h-24 rounded-2xl flex items-center justify-center text-5xl
                    ${isEarned
                      ? `bg-gradient-to-br ${rarityColors[badge.rarity]} shadow-soft-lg`
                      : 'bg-neutral-200'
                    }
                  `}
                  style={isEarned ? { backgroundColor: badge.color + '40' } : {}}
                >
                  {isEarned ? badge.icon : <Lock className="w-12 h-12 text-neutral-400" />}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-1">
                  {badge.name}
                </h2>
                <p className="text-sm text-neutral-600 mb-2">
                  {badge.description}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span
                    className="px-3 py-1 rounded-full font-semibold capitalize"
                    style={{
                      backgroundColor: badge.color + '30',
                      color: badge.color,
                    }}
                  >
                    {badge.rarity}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 font-semibold">
                    {categoryLabels[badge.category]}
                  </span>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4">
                <h3 className="text-sm font-semibold text-neutral-700 mb-3">
                  Requirements
                </h3>
                {isEarned ? (
                  <div className="flex items-center justify-center gap-2 text-success-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Completed!</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Progress</span>
                      <span className="text-sm font-semibold text-neutral-900">
                        {progress}/{total}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPercentage}%`,
                          backgroundColor: badge.color,
                        }}
                      />
                    </div>
                    <p className="text-xs text-neutral-500">
                      {Math.round(progressPercentage)}% complete
                    </p>
                  </div>
                )}

                {isEarned && badge.earnedAt && (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <p className="text-xs text-neutral-500">Earned on</p>
                    <p className="text-sm font-semibold text-neutral-900">
                      {new Date(badge.earnedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
