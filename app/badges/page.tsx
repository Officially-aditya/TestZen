'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter } from 'lucide-react';
import Starfield from '@/components/Starfield';
import BadgeCard from '@/components/badges/BadgeCard';
import BadgeDetailModal from '@/components/badges/BadgeDetailModal';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';
import { getUserStats, getSessions } from '@/lib/storage';
import { UserStats, Badge } from '@/types';
import { ALL_BADGES } from '@/lib/badges';
import { getAllBadgesWithProgress } from '@/utils/badgeTracker';

type CategoryFilter = 'all' | 'foundation' | 'mode' | 'time' | 'milestone' | 'special';
type StatusFilter = 'all' | 'earned' | 'locked';

export default function BadgesPage() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [badgeProgress, setBadgeProgress] = useState<Record<string, { progress: number; total: number }>>({});

  useEffect(() => {
    const loadStats = () => {
      const userStats = getUserStats();
      const sessions = getSessions();
      
      const badgesWithProgress = getAllBadgesWithProgress(userStats, sessions);
      const progressMap: Record<string, { progress: number; total: number }> = {};
      badgesWithProgress.forEach(bp => {
        progressMap[bp.badge.id] = {
          progress: bp.progress,
          total: bp.total,
        };
      });
      
      setBadgeProgress(progressMap);
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

  const earnedIds = new Set(stats.badges.map(b => b.id));

  let filteredBadges = ALL_BADGES;

  if (categoryFilter !== 'all') {
    filteredBadges = filteredBadges.filter(badge => badge.category === categoryFilter);
  }

  if (statusFilter === 'earned') {
    filteredBadges = filteredBadges.filter(badge => earnedIds.has(badge.id));
  } else if (statusFilter === 'locked') {
    filteredBadges = filteredBadges.filter(badge => !earnedIds.has(badge.id));
  }

  const sortedBadges = [...filteredBadges].sort((a, b) => {
    const aEarned = earnedIds.has(a.id);
    const bEarned = earnedIds.has(b.id);
    if (aEarned && !bEarned) return -1;
    if (!aEarned && bEarned) return 1;
    return a.order - b.order;
  });

  const earnedCount = stats.badges.length;
  const totalCount = ALL_BADGES.length;

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedBadge(null), 300);
  };

  const categoryTabs: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'foundation', label: 'Foundation' },
    { value: 'mode', label: 'Mode' },
    { value: 'time', label: 'Time' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'special', label: 'Special' },
  ];

  const statusTabs: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'earned', label: 'Earned' },
    { value: 'locked', label: 'Locked' },
  ];

  return (
    <>
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
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 mb-2">
              Badge Collection
            </h1>
            <p className="text-sm sm:text-base text-neutral-600">
              Track your achievements and progress - {earnedCount}/{totalCount} badges earned
            </p>
          </motion.header>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 space-y-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-neutral-600" />
              <span className="text-sm font-semibold text-neutral-900">Filter by Category</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryTabs.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setCategoryFilter(tab.value)}
                  className={`
                    px-4 py-2 rounded-xl font-semibold text-sm transition-all
                    ${categoryFilter === tab.value
                      ? 'bg-primary-500 text-white shadow-soft'
                      : 'bg-white border-2 border-neutral-200 text-neutral-700 hover:border-primary-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-3 mt-6">
              <Filter className="w-5 h-5 text-neutral-600" />
              <span className="text-sm font-semibold text-neutral-900">Filter by Status</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusTabs.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`
                    px-4 py-2 rounded-xl font-semibold text-sm transition-all
                    ${statusFilter === tab.value
                      ? 'bg-primary-500 text-white shadow-soft'
                      : 'bg-white border-2 border-neutral-200 text-neutral-700 hover:border-primary-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-soft-lg p-6 sm:p-8"
          >
            {sortedBadges.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">
                  No badges found
                </h3>
                <p className="text-sm text-neutral-600">
                  Try adjusting your filters to see more badges
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {sortedBadges.map((badge, index) => {
                  const isEarned = earnedIds.has(badge.id);
                  const progress = badgeProgress[badge.id];

                  return (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      isEarned={isEarned}
                      progress={progress?.progress}
                      total={progress?.total}
                      onClick={() => handleBadgeClick(badge)}
                      delay={index * 0.02}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <BadgeDetailModal
        badge={selectedBadge}
        isEarned={selectedBadge ? earnedIds.has(selectedBadge.id) : false}
        progress={selectedBadge ? badgeProgress[selectedBadge.id]?.progress : 0}
        total={selectedBadge ? badgeProgress[selectedBadge.id]?.total : 1}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
