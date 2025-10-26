'use client';

import { motion } from 'framer-motion';
import { Brain, Focus, Wind } from 'lucide-react';
import { SessionMode } from '@/types';

interface ModeSelectorProps {
  selectedMode: SessionMode;
  onModeChange: (mode: SessionMode) => void;
  disabled?: boolean;
}

const modes = [
  {
    id: 'meditation' as SessionMode,
    name: 'Meditation',
    description: 'Mindful awareness',
    icon: Brain,
    color: 'primary',
  },
  {
    id: 'focus' as SessionMode,
    name: 'Focus',
    description: 'Deep work',
    icon: Focus,
    color: 'primary',
  },
  {
    id: 'breathwork' as SessionMode,
    name: 'Breathwork',
    description: 'Calm breathing',
    icon: Wind,
    color: 'primary',
  },
];

export default function ModeSelector({ selectedMode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-neutral-700 mb-3 text-center sm:text-left">
        Choose your practice
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <motion.button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
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
              aria-label={`Select ${mode.name} mode`}
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
