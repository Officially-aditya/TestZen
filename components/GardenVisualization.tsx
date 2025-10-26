'use client';

import { motion } from 'framer-motion';
import { GardenState } from '@/types';

interface GardenVisualizationProps {
  gardenState: GardenState;
}

const plantEmojis = ['🌱', '🌿', '🌳', '🌸', '🌺', '🌻', '🌷', '🪴'];

export default function GardenVisualization({ gardenState }: GardenVisualizationProps) {
  const plantsToShow = Math.min(gardenState.growthLevel, 8);
  const plants = plantEmojis.slice(0, plantsToShow);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-success-50 to-primary-50 border-2 border-neutral-200 shadow-soft"
    >
      <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4">
        Your Mindfulness Garden
      </h3>
      
      <div className="flex flex-wrap gap-4 justify-center min-h-[120px] items-center">
        {plants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl sm:text-4xl mb-2">🌱</p>
            <p className="text-sm sm:text-base text-neutral-600">
              Complete sessions to grow your garden
            </p>
          </div>
        ) : (
          plants.map((plant, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.1, type: 'spring' }}
              className="text-4xl sm:text-5xl"
              role="img"
              aria-label={`Plant ${index + 1}`}
            >
              {plant}
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-neutral-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-600">Growth Level</span>
          <span className="font-semibold text-neutral-900">
            {gardenState.growthLevel} / 8
          </span>
        </div>
        <div className="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(gardenState.growthLevel / 8) * 100}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-success-400 to-success-600"
          />
        </div>
      </div>
    </motion.div>
  );
}
