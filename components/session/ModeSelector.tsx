'use client';

import { motion } from 'framer-motion';
import { Brain, Target, Heart } from 'lucide-react';

export type SessionModeConfig = {
  id: string;
  name: string;
  description: string;
  duration: number;
  icon: typeof Brain;
  color: string;
};

export const sessionModes: SessionModeConfig[] = [
  {
    id: 'calm',
    name: 'Calm',
    description: 'Peaceful relaxation',
    duration: 5,
    icon: Brain,
    color: 'primary',
  },
  {
    id: 'focus',
    name: 'Focus',
    description: 'Deep concentration',
    duration: 8,
    icon: Target,
    color: 'primary',
  },
  {
    id: 'gratitude',
    name: 'Gratitude',
    description: 'Thankful reflection',
    duration: 10,
    icon: Heart,
    color: 'primary',
  },
];

interface ModeSelectorProps {
  selectedMode?: SessionModeConfig;
  onModeChange: (mode: SessionModeConfig) => void;
  disabled?: boolean;
}

export default function ModeSelector({ selectedMode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-neutral-700 mb-3 text-center sm:text-left">
        Choose your practice mode
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sessionModes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode?.id === mode.id;

          return (
            <motion.button
              key={mode.id}
              onClick={() => onModeChange(mode)}
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              className={`
                relative p-4 sm:p-6 rounded-2xl border-2 transition-all focus-ring
                ${isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-soft'
                  : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-soft'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-label={`Select ${mode.name} mode, ${mode.duration} minutes`}
              aria-pressed={isSelected}
            >
              <div className="flex flex-col items-center space-y-2 text-center">
                <motion.div
                  animate={{
                    scale: isSelected ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className={`
                    p-3 rounded-xl
                    ${isSelected ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-600'}
                  `}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.div>
                <div>
                  <p className={`font-semibold text-sm sm:text-base ${isSelected ? 'text-primary-700' : 'text-neutral-900'}`}>
                    {mode.name}
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                    {mode.description}
                  </p>
                  <p className="text-xs font-medium text-neutral-500 mt-1">
                    {mode.duration} minutes
                  </p>
                </div>
              </div>
              {isSelected && (
                <motion.div
                  layoutId="mode-indicator"
                  className="absolute inset-0 rounded-2xl border-2 border-primary-500"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
