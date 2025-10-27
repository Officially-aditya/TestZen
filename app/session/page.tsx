'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle, CheckCircle, Wallet } from 'lucide-react';
import ModeSelector, { SessionModeConfig, sessionModes } from '@/components/session/ModeSelector';
import MeditationTimer from '@/components/session/MeditationTimer';
import ReflectionJournal from '@/components/session/ReflectionJournal';
import XPGainAnimation from '@/components/XPGainAnimation';
import BadgeUnlocked from '@/components/BadgeUnlocked';
import Starfield from '@/components/Starfield';
import WalletConnect from '@/components/WalletConnect';
import { useWallet } from '@/hooks/useWallet';
import { Session, Badge } from '@/types';
import {
  getUserStats,
  saveUserStats,
  addSession,
  calculateXP,
  calculateLevel,
  checkForNewBadges,
  updateGardenTiles,
  updateNFTStatus,
} from '@/lib/storage';
import { encryptText } from '@/lib/encryption';
import { computeHash } from '@/lib/encryption';

type SessionState = 'setup' | 'active' | 'complete' | 'reflection' | 'badges' | 'error';

export default function SessionPage() {
  const router = useRouter();
  const { connected, accountId, signMessage } = useWallet();
  const [sessionState, setSessionState] = useState<SessionState>('setup');
  const [selectedMode, setSelectedMode] = useState<SessionModeConfig | undefined>();
  const [xpGained, setXpGained] = useState(0);
  const [newLevel, setNewLevel] = useState<number>();
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date>();
  const [sessionId, setSessionId] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeSelect = useCallback((mode: SessionModeConfig) => {
    setSelectedMode(mode);
  }, []);

  const handleBeginSession = useCallback(async () => {
    if (!selectedMode) {
      setError('Please select a session mode');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const stats = getUserStats();
      const startTime = new Date();

      // Call the start API
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: accountId || stats.totalXP.toString(),
          walletAddress: accountId,
          mode: selectedMode.id,
          duration: selectedMode.duration,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to start session');
      }

      setSessionId(result.sessionId);
      setSessionStartTime(startTime);
      setSessionState('active');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setSessionState('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedMode, accountId]);

  const handleTimerComplete = useCallback(() => {
    if (!selectedMode) return;

    const stats = getUserStats();
    const earnedXP = calculateXP(selectedMode.duration, selectedMode.id);
    const oldLevel = stats.level;
    
    const newTotalXP = stats.totalXP + earnedXP;
    const newLevelValue = calculateLevel(newTotalXP);

    let newStats = {
      ...stats,
      totalXP: newTotalXP,
      level: newLevelValue,
      sessionsCompleted: stats.sessionsCompleted + 1,
      totalMinutes: stats.totalMinutes + selectedMode.duration,
      gardenState: {
        ...stats.gardenState,
        growthLevel: Math.min(stats.gardenState.growthLevel + 1, 8),
      },
    };

    const badges = checkForNewBadges(newStats);
    if (badges.length > 0) {
      newStats.badges = [...stats.badges, ...badges];
    }

    newStats = updateGardenTiles(newStats);
    newStats = updateNFTStatus(newStats);

    saveUserStats(newStats);

    setXpGained(earnedXP);
    setNewLevel(newLevelValue > oldLevel ? newLevelValue : undefined);
    setNewBadges(badges);
    setSessionState('reflection');
  }, [selectedMode]);

  const handleCancelSession = useCallback(() => {
    if (window.confirm('Are you sure you want to cancel this session? Your progress will not be saved.')) {
      router.push('/');
    }
  }, [router]);

  const handleSubmitReflection = useCallback(async (reflection: string) => {
    if (!selectedMode || !sessionStartTime) {
      setError('Session data is missing');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const stats = getUserStats();
      
      // Encrypt reflection if provided
      let encryptedReflection;
      let reflectionHash;
      
      if (reflection.trim()) {
        const baseKey = process.env.NEXT_PUBLIC_ENCRYPTION_BASE_KEY || 'default-base-key-replace-in-production';
        const userInfo = accountId || stats.totalXP.toString();
        
        encryptedReflection = await encryptText(reflection, baseKey, userInfo);
        reflectionHash = await computeHash(encryptedReflection.ciphertext);
      }

      const earnedXP = xpGained;

      // Prepare session data for signature
      const sessionData = {
        mode: selectedMode.id,
        duration: selectedMode.duration,
        startTime: sessionStartTime.toISOString(),
        xpEarned: earnedXP,
        reflectionHash,
      };

      // Get wallet signature if wallet is connected
      let signature;
      if (connected && accountId && signMessage) {
        try {
          const message = JSON.stringify(sessionData, null, 0);
          const signatureBytes = await signMessage(message);
          if (signatureBytes) {
            signature = Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join('');
          }
        } catch (signError) {
          console.error('Signature error:', signError);
          setError('Failed to sign session data. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Call API to complete session
      const response = await fetch('/api/session/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: accountId || stats.totalXP.toString(),
          walletAddress: accountId,
          mode: selectedMode.id,
          duration: selectedMode.duration,
          startTime: sessionStartTime.toISOString(),
          xpEarned: earnedXP,
          signature,
          encryptedReflection: encryptedReflection ? {
            ciphertext: encryptedReflection.ciphertext,
            iv: encryptedReflection.iv,
            salt: encryptedReflection.salt,
          } : undefined,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to complete session');
      }

      // Store session locally
      const session: Session = {
        id: result.sessionId || sessionId || Date.now().toString(),
        mode: selectedMode.id as any,
        duration: selectedMode.duration,
        startTime: sessionStartTime,
        endTime: new Date(),
        completed: true,
        xpEarned: earnedXP,
        reflectionCID: result.reflectionCID,
        reflectionHash: result.reflectionHash,
      };
      addSession(session);
      
      // Continue to completion state
      setSessionState('complete');
    } catch (err) {
      console.error('Error submitting reflection:', err);
      setError(err instanceof Error ? err.message : 'Failed to save session');
      // Don't block user - allow them to try again or continue
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedMode, sessionStartTime, xpGained, connected, accountId, sessionId, signMessage]);

  const handleSkipReflection = useCallback(() => {
    setSessionState('complete');
  }, []);

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

  const handleRetry = useCallback(() => {
    setError(null);
    setSessionState('setup');
  }, []);

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
                    Start a Meditation Session
                  </h1>
                  <p className="text-neutral-600 text-sm sm:text-base mb-4">
                    Find a quiet space, get comfortable, and prepare to focus inward
                  </p>
                </div>

                {/* Wallet Connection Section */}
                <div className="bg-gradient-to-br from-primary-50 to-success-50 rounded-2xl p-6 border-2 border-primary-100">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Wallet Connection
                  </h3>
                  
                  <WalletConnect />
                  
                  <p className="text-xs text-neutral-600 text-center mt-3">
                    Connect your HashPack wallet to sign sessions and unlock NFT features (optional)
                  </p>
                </div>

                {/* Session Instructions */}
                <div className="bg-neutral-50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                    Before You Begin
                  </h3>
                  <ul className="space-y-2 text-sm text-neutral-700">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 font-bold">•</span>
                      <span>Find a comfortable seated position</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 font-bold">•</span>
                      <span>Minimize distractions and silence notifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 font-bold">•</span>
                      <span>Close your eyes or soften your gaze</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 font-bold">•</span>
                      <span>Breathe naturally and stay present</span>
                    </li>
                  </ul>
                </div>

                {/* Mode Selection */}
                <ModeSelector
                  selectedMode={selectedMode}
                  onModeChange={handleModeSelect}
                  disabled={isSubmitting}
                />

                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </motion.div>
                )}

                {/* Begin Button */}
                <motion.button
                  whileHover={{ scale: selectedMode ? 1.02 : 1 }}
                  whileTap={{ scale: selectedMode ? 0.98 : 1 }}
                  onClick={handleBeginSession}
                  disabled={!selectedMode || isSubmitting}
                  className="w-full py-4 rounded-2xl bg-primary-500 text-white font-semibold text-base sm:text-lg shadow-soft-lg hover:bg-primary-600 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Starting Session...' : 'Begin Session'}
                </motion.button>

                {!selectedMode && (
                  <p className="text-xs text-center text-neutral-500">
                    Please select a mode to continue
                  </p>
                )}
              </motion.div>
            )}

            {sessionState === 'active' && selectedMode && (
              <motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-1 capitalize">
                    {selectedMode.name} Session
                  </h2>
                  <p className="text-sm sm:text-base text-neutral-600">
                    Stay present and focused on your practice
                  </p>
                </div>
                <MeditationTimer
                  duration={selectedMode.duration}
                  onComplete={handleTimerComplete}
                  onCancel={handleCancelSession}
                  allowEarlyCompletion={process.env.NODE_ENV === 'development'}
                />
              </motion.div>
            )}

            {sessionState === 'reflection' && (
              <motion.div
                key="reflection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ReflectionJournal
                  onSubmit={handleSubmitReflection}
                  onSkip={handleSkipReflection}
                  isSubmitting={isSubmitting}
                  error={error}
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
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="text-6xl mb-4"
                  >
                    🎉
                  </motion.div>
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
                  Continue to Dashboard
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

            {sessionState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                <div className="text-6xl mb-4">⚠️</div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    Something Went Wrong
                  </h2>
                  <p className="text-neutral-600 text-sm sm:text-base">
                    {error || 'An unexpected error occurred'}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRetry}
                  className="px-8 py-3 rounded-2xl bg-primary-500 text-white font-semibold shadow-soft-lg hover:bg-primary-600 transition-colors focus-ring"
                >
                  Try Again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
