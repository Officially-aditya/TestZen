'use client';

import { motion } from 'framer-motion';

interface DurationSelectorProps {
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
  disabled?: boolean;
}

const durations = [5, 10, 15, 20, 30, 45, 60];

export default function DurationSelector({
  selectedDuration,
  onDurationChange,
  disabled,
}: DurationSelectorProps) {
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-neutral-700 mb-3 text-center sm:text-left">
        Session duration
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3">
        {durations.map((duration) => {
          const isSelected = selectedDuration === duration;

          return (
            <motion.button
              key={duration}
              onClick={() => onDurationChange(duration)}
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.05 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
              className={`
                relative px-3 py-3 sm:px-4 sm:py-4 rounded-2xl font-semibold text-sm sm:text-base transition-all focus-ring
                ${isSelected
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'bg-white text-neutral-700 border-2 border-neutral-200 hover:border-primary-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-label={`Set duration to ${duration} minutes`}
              aria-pressed={isSelected}
            >
              <span className="block text-lg sm:text-xl font-bold">{duration}</span>
              <span className="block text-xs opacity-90">min</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
