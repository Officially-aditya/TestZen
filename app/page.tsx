'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Clock, Award, BarChart, LayoutDashboard } from 'lucide-react';
import Starfield from '@/components/Starfield';
import StatsCard from '@/components/StatsCard';
import GardenVisualization from '@/components/GardenVisualization';
import BadgeGrid from '@/components/BadgeGrid';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';
import { getUserStats } from '@/lib/storage';
import { UserStats, Badge } from '@/types';

const allBadges: Badge[] = [
  {
    id: 'first_session',
    name: 'First Steps',
    description: 'Complete your first session',
    icon: '🌱',
    rarity: 'common',
  },
  {
    id: 'ten_sessions',
    name: 'Dedicated',
    description: 'Complete 10 sessions',
    icon: '🌿',
    rarity: 'common',
  },
  {
    id: 'hundred_minutes',
    name: 'Centurion',
    description: 'Meditate for 100 minutes',
    icon: '⏱️',
    rarity: 'rare',
  },
  {
    id: 'level_five',
    name: 'Rising Star',
    description: 'Reach level 5',
    icon: '⭐',
    rarity: 'rare',
  },
  {
    id: 'level_ten',
    name: 'Zen Master',
    description: 'Reach level 10',
    icon: '🧘',
    rarity: 'epic',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = () => {
      const userStats = getUserStats();
      setStats(userStats);
      setIsLoading(false);
    };

    loadStats();
  }, []);

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
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 sm:mb-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 mb-2">
                TestZen
              </h1>
              <p className="text-sm sm:text-base text-neutral-600">
                Your mindful practice tracker
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard')}
                className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-white border-2 border-primary-500 text-primary-500 font-semibold shadow-soft hover:bg-primary-50 transition-colors focus-ring text-base sm:text-lg"
                aria-label="View dashboard"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/session')}
                className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-primary-500 text-white font-semibold shadow-soft-lg hover:bg-primary-600 transition-colors focus-ring text-base sm:text-lg"
                aria-label="Start new session"
              >
                <Play className="w-5 h-5" />
                <span>Start Session</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        <div className="space-y-6 sm:space-y-8">
          <section aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="sr-only">Your Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                icon={TrendingUp}
                label="Level"
                value={stats.level}
                delay={0}
              />
              <StatsCard
                icon={BarChart}
                label="Total XP"
                value={stats.totalXP}
                delay={0.1}
              />
              <StatsCard
                icon={Clock}
                label="Total Minutes"
                value={stats.totalMinutes}
                delay={0.2}
              />
              <StatsCard
                icon={Award}
                label="Sessions"
                value={stats.sessionsCompleted}
                delay={0.3}
              />
            </div>
          </section>

          <section aria-labelledby="garden-heading">
            <h2 id="garden-heading" className="sr-only">Your Mindfulness Garden</h2>
            <GardenVisualization gardenState={stats.gardenState} />
          </section>

          <section aria-labelledby="badges-heading">
            <h2 id="badges-heading" className="sr-only">Badges Collection</h2>
            <BadgeGrid badges={allBadges} earnedBadges={stats.badges} />
          </section>

          {stats.sessionsCompleted === 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary-50 to-success-50 border-2 border-neutral-200"
            >
              <div className="text-5xl sm:text-6xl mb-4">🧘</div>
              <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
                Welcome to TestZen
              </h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-6 max-w-md mx-auto">
                Start your first session to begin your mindfulness journey. Track your progress,
                earn badges, and watch your garden grow.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/session')}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary-500 text-white font-semibold shadow-soft-lg hover:bg-primary-600 transition-colors focus-ring"
              >
                <Play className="w-5 h-5" />
                <span>Begin Your Journey</span>
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
