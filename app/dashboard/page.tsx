'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Play, ArrowLeft, Calendar, Clock } from 'lucide-react';
import Starfield from '@/components/Starfield';
import GardenGrid from '@/components/garden/GardenGrid';
import XPBar from '@/components/garden/XPBar';
import NFTBadge from '@/components/nft/NFTBadge';
import WalletConnect from '@/components/WalletConnect';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';
import { useWallet } from '@/hooks/useWallet';
import {
  getUserStats,
  saveUserStats,
  getSessions,
  updateGardenTiles,
  updateNFTStatus,
} from '@/lib/storage';
import { UserStats, Session } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { connected } = useWallet();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    let userStats = getUserStats();
    
    userStats = updateGardenTiles(userStats);
    userStats = updateNFTStatus(userStats);
    
    saveUserStats(userStats);
    setStats(userStats);

    const allSessions = getSessions();
    const recent = allSessions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5);
    setRecentSessions(recent);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMintNFT = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (stats && stats.nftStatus?.eligible) {
      const mockTokenId = Math.floor(Math.random() * 10000).toString();
      
      const updatedStats = {
        ...stats,
        nftStatus: {
          ...stats.nftStatus,
          minted: true,
          tokenId: mockTokenId,
          mintedAt: new Date(),
          metadata: {
            name: 'Zen Garden Master',
            description: 'A badge of achievement for completing the mindfulness garden journey',
            image: 'ipfs://QmZenGardenBadge',
            attributes: [
              { trait_type: 'Level', value: stats.level },
              { trait_type: 'Total XP', value: stats.totalXP },
              { trait_type: 'Sessions', value: stats.sessionsCompleted },
              { trait_type: 'Rarity', value: 'Legendary' },
            ],
          },
        },
      };
      
      saveUserStats(updatedStats);
      setStats(updatedStats);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <Starfield />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen relative pb-8">
      <Starfield />
      
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6 focus-ring rounded-lg px-2 py-1"
          aria-label="Go back to home"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base">Back to Home</span>
        </motion.button>

        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 sm:mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 mb-2">
                Your Dashboard
              </h1>
              <p className="text-sm sm:text-base text-neutral-600">
                Track your progress and mint your achievements
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-64">
                <WalletConnect />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/session')}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 text-white font-semibold shadow-soft-lg hover:bg-primary-600 transition-colors focus-ring"
              >
                <Play className="w-5 h-5" />
                <span>New Session</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        {!connected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-primary-50 to-success-50 border-2 border-primary-200"
          >
            <h3 className="text-lg font-bold text-neutral-900 mb-2">
              🔗 Connect Your Wallet
            </h3>
            <p className="text-sm text-neutral-700">
              Connect your HashPack wallet to unlock NFT minting and save your achievements on the
              Hedera blockchain. Your progress is currently saved locally.
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <XPBar totalXP={stats.totalXP} level={stats.level} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GardenGrid
                gardenState={stats.gardenState}
                isEligibleForMint={stats.nftStatus?.eligible || false}
              />
            </motion.div>

            {recentSessions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 sm:p-8"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-4">
                  Recent Sessions
                </h2>
                <div className="space-y-3">
                  {recentSessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                          <span className="text-xl">
                            {session.mode === 'meditation' ? '🧘' : session.mode === 'focus' ? '🎯' : '💨'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900 capitalize">
                            {session.mode}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-neutral-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(session.startTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(session.startTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral-900">
                          {session.duration} min
                        </p>
                        <p className="text-xs text-success-600 font-semibold">
                          +{session.xpEarned} XP
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <NFTBadge
              nftStatus={stats.nftStatus || { eligible: false, minted: false }}
              onMint={handleMintNFT}
            />
          </motion.div>
        </div>

        {stats.sessionsCompleted === 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary-50 to-success-50 border-2 border-neutral-200"
          >
            <div className="text-5xl sm:text-6xl mb-4">🌟</div>
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
              Start Your Journey
            </h3>
            <p className="text-sm sm:text-base text-neutral-600 mb-6 max-w-md mx-auto">
              Begin your first session to start growing your mindfulness garden. Each session
              brings you closer to unlocking your NFT badge!
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/session')}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary-500 text-white font-semibold shadow-soft-lg hover:bg-primary-600 transition-colors focus-ring"
            >
              <Play className="w-5 h-5" />
              <span>Begin Your First Session</span>
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
