'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface XPGainAnimationProps {
  xpGained: number;
  newLevel?: number;
}

export default function XPGainAnimation({ xpGained, newLevel }: XPGainAnimationProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="flex flex-col items-center space-y-4 p-6 sm:p-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.6, times: [0, 0.6, 1] }}
        className="relative"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-soft-lg">
          <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
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
          className="absolute inset-0 rounded-full bg-primary-400"
        />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <motion.p
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="text-3xl sm:text-4xl font-bold text-primary-600"
        >
          +{xpGained} XP
        </motion.p>
        <p className="text-neutral-600 mt-2 text-sm sm:text-base">Great work!</p>
      </motion.div>

      {newLevel && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="mt-4 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-soft-lg"
        >
          <p className="text-lg sm:text-xl font-bold">Level {newLevel}! 🎉</p>
        </motion.div>
      )}
    </motion.div>
  );
}
