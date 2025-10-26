'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import ModeSelector from '@/components/ModeSelector';
import DurationSelector from '@/components/DurationSelector';
import SessionTimer from '@/components/SessionTimer';
import XPGainAnimation from '@/components/XPGainAnimation';
import BadgeUnlocked from '@/components/BadgeUnlocked';
import Starfield from '@/components/Starfield';
import { SessionMode, Session, Badge } from '@/types';
import {
  getUserStats,
  saveUserStats,
  addSession,
  calculateXP,
  calculateLevel,
  checkForNewBadges,
} from '@/lib/storage';

type SessionState = 'setup' | 'active' | 'complete' | 'badges';

export default function SessionPage() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>('setup');
  const [mode, setMode] = useState<SessionMode>('meditation');
  const [duration, setDuration] = useState(10);
  const [xpGained, setXpGained] = useState(0);
  const [newLevel, setNewLevel] = useState<number>();
  const [newBadges, setNewBadges] = useState<Badge[]>([]);

  const handleComplete = useCallback(() => {
    const stats = getUserStats();
    const earnedXP = calculateXP(duration, mode);
    const oldLevel = stats.level;
    
    const newTotalXP = stats.totalXP + earnedXP;
    const newLevelValue = calculateLevel(newTotalXP);

    const newStats = {
      ...stats,
      totalXP: newTotalXP,
      level: newLevelValue,
      sessionsCompleted: stats.sessionsCompleted + 1,
      totalMinutes: stats.totalMinutes + duration,
      gardenState: {
        ...stats.gardenState,
        growthLevel: Math.min(stats.gardenState.growthLevel + 1, 8),
      },
    };

    const badges = checkForNewBadges(newStats);
    if (badges.length > 0) {
      newStats.badges = [...stats.badges, ...badges];
    }

    saveUserStats(newStats);

    const session: Session = {
      id: Date.now().toString(),
      mode,
      duration,
      startTime: new Date(Date.now() - duration * 60 * 1000),
      endTime: new Date(),
      completed: true,
      xpEarned: earnedXP,
    };
    addSession(session);

    setXpGained(earnedXP);
    setNewLevel(newLevelValue > oldLevel ? newLevelValue : undefined);
    setNewBadges(badges);
    setSessionState('complete');
  }, [duration, mode]);

  const handleCancel = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleContinue = useCallback(() => {
    if (newBadges.length > 0) {
      setSessionState('badges');
    } else {
      router.push('/');
    }
  }, [newBadges.length, router]);

  const handleBadgesContinue = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen relative">
      <Starfield />
      
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {sessionState !== 'active' && (
          <motion.button
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6 focus-ring rounded-lg px-2 py-1"
            aria-label="Go back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm sm:text-base">Back to Dashboard</span>
          </motion.button>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 sm:p-8 md:p-10">
          <AnimatePresence mode="wait">
            {sessionState === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
                    Start a Session
                  </h1>
                  <p className="text-neutral-600 text-sm sm:text-base">
                    Choose your practice and duration
                  </p>
                </div>

                <ModeSelector
                  selectedMode={mode}
                  onModeChange={setMode}
                />

                <DurationSelector
                  selectedDuration={duration}
                  onDurationChange={setDuration}
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSessionState('active')}
                  className="w-full py-4 rounded-2xl bg-primary-500 text-white font-semibold text-base sm:text-lg shadow-soft-lg hover:bg-primary-600 transition-colors focus-ring"
                >
                  Begin Session
                </motion.button>
              </motion.div>
            )}

            {sessionState === 'active' && (
              <motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-1 capitalize">
                    {mode}
                  </h2>
                  <p className="text-sm sm:text-base text-neutral-600">
                    Stay present and focused
                  </p>
                </div>
                <SessionTimer
                  duration={duration}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                />
              </motion.div>
            )}

            {sessionState === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
                    Session Complete!
                  </h2>
                  <p className="text-neutral-600 text-sm sm:text-base">
                    Well done on completing your practice
                  </p>
                </div>
                <XPGainAnimation xpGained={xpGained} newLevel={newLevel} />
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={handleContinue}
                  className="w-full mt-6 py-4 rounded-2xl bg-primary-500 text-white font-semibold text-base sm:text-lg shadow-soft-lg hover:bg-primary-600 transition-colors focus-ring"
                >
                  Continue
                </motion.button>
              </motion.div>
            )}

            {sessionState === 'badges' && (
              <motion.div
                key="badges"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <BadgeUnlocked badges={newBadges} onClose={handleBadgesContinue} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
