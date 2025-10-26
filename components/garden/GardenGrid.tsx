'use client';

import { motion } from 'framer-motion';
import { Sparkles, Lock } from 'lucide-react';
import { GardenState } from '@/types';

interface GardenGridProps {
  gardenState: GardenState;
  isEligibleForMint: boolean;
}

export default function GardenGrid({ gardenState, isEligibleForMint }: GardenGridProps) {
  const { tiles } = gardenState;

  const getGrowthEmoji = (tileIndex: number, completed: boolean) => {
    if (!completed) return '🌱';
    
    if (tileIndex < 3) return '🌸';
    if (tileIndex < 6) return '🌺';
    return '🌻';
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1">
            Mindfulness Garden
          </h2>
          <p className="text-sm text-neutral-600">
            Complete sessions to grow your garden
          </p>
        </div>
        {isEligibleForMint && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-primary-500 to-success-500 text-white text-sm font-semibold"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ready to mint!</span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md mx-auto">
        {tiles.map((tile, index) => (
          <motion.div
            key={tile.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            <motion.div
              animate={
                tile.completed
                  ? {
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: tile.completed ? Infinity : 0,
                repeatDelay: 3,
              }}
              className={`
                aspect-square rounded-2xl flex items-center justify-center text-4xl sm:text-5xl
                transition-all duration-300
                ${
                  tile.completed
                    ? 'bg-gradient-to-br from-success-100 to-primary-100 border-2 border-success-300'
                    : 'bg-neutral-100 border-2 border-neutral-200'
                }
              `}
            >
              {tile.completed ? (
                <span className="filter drop-shadow-md">
                  {getGrowthEmoji(index, tile.completed)}
                </span>
              ) : (
                <Lock className="w-8 h-8 text-neutral-400" />
              )}
            </motion.div>

            {tile.completed && isEligibleForMint && index === tiles.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary-500 to-success-500 blur-md -z-10"
              />
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          {tiles.filter(t => t.completed).length} / {tiles.length} tiles completed
        </p>
        {!isEligibleForMint && (
          <p className="text-xs text-neutral-500 mt-1">
            Complete all 9 tiles to unlock your NFT badge
          </p>
        )}
      </div>
    </div>
  );
}
