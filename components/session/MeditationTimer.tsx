'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, AlertCircle } from 'lucide-react';

interface MeditationTimerProps {
  duration: number;
  onComplete: () => void;
  onCancel: () => void;
  allowEarlyCompletion?: boolean;
}

export default function MeditationTimer({ 
  duration, 
  onComplete, 
  onCancel,
  allowEarlyCompletion = false 
}: MeditationTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [canComplete, setCanComplete] = useState(false);

  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          setCanComplete(true);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, onComplete]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const handlePause = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    onCancel();
  }, [onCancel]);

  const handleForceComplete = useCallback(() => {
    if (allowEarlyCompletion && window.confirm('Complete session early? (for testing purposes)')) {
      setIsRunning(false);
      setCanComplete(true);
      onComplete();
    }
  }, [allowEarlyCompletion, onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeRemaining) / (duration * 60)) * 100;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-4 sm:p-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm"
      >
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-neutral-200"
          />
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-primary-500"
            initial={{ strokeDasharray: '565.48', strokeDashoffset: '565.48' }}
            animate={{ strokeDashoffset: `${565.48 - (565.48 * progress) / 100}` }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            key={timeRemaining}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <p
              className="text-4xl sm:text-6xl font-bold text-neutral-900 tabular-nums"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
            >
              {formatTime(timeRemaining)}
            </p>
            {!isRunning && !canComplete && (
              <p className="text-sm text-neutral-500 mt-2">Press play to begin</p>
            )}
          </motion.div>
        </div>
      </motion.div>

      <div className="flex items-center gap-4">
        <AnimatePresence mode="wait">
          {!isRunning ? (
            <motion.button
              key="start"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={handleStart}
              disabled={canComplete}
              className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary-500 text-white shadow-soft-lg hover:bg-primary-600 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Start session"
            >
              <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-1" />
            </motion.button>
          ) : (
            <motion.button
              key="pause"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={handlePause}
              className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary-500 text-white shadow-soft-lg hover:bg-primary-600 transition-colors focus-ring"
              aria-label={isPaused ? 'Resume session' : 'Pause session'}
            >
              <Pause className="w-6 h-6 sm:w-8 sm:h-8" />
            </motion.button>
          )}
        </AnimatePresence>

        {isRunning && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={handleStop}
            className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-neutral-200 text-neutral-700 shadow-soft hover:bg-neutral-300 transition-colors focus-ring"
            aria-label="Stop session"
          >
            <Square className="w-6 h-6 sm:w-8 sm:h-8" />
          </motion.button>
        )}
      </div>

      {isPaused && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-neutral-600 text-sm sm:text-base"
        >
          Session paused
        </motion.p>
      )}

      {allowEarlyCompletion && isRunning && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleForceComplete}
          className="text-xs text-neutral-500 hover:text-neutral-700 underline"
        >
          Complete early (dev mode)
        </motion.button>
      )}

      {!canComplete && timeRemaining === duration * 60 && !isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 bg-primary-50 border border-primary-200 rounded-xl max-w-md"
        >
          <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-primary-700">
            Press the play button to start your meditation. Find a comfortable position and focus on your breath.
          </p>
        </motion.div>
      )}
    </div>
  );
}
