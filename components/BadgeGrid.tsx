'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Badge } from '@/types';
import BadgeCard from '@/components/badges/BadgeCard';
import BadgeDetailModal from '@/components/badges/BadgeDetailModal';
import { ArrowRight } from 'lucide-react';

interface BadgeGridProps {
  badges: Badge[];
  earnedBadges: Badge[];
  limit?: number;
  showAllButton?: boolean;
  progress?: Record<string, { progress: number; total: number }>;
}

export default function BadgeGrid({
  badges,
  earnedBadges,
  limit,
  showAllButton = false,
  progress = {},
}: BadgeGridProps) {
  const router = useRouter();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const earnedIds = new Set(earnedBadges.map(b => b.id));

  const sortedBadges = [...badges].sort((a, b) => {
    const aEarned = earnedIds.has(a.id);
    const bEarned = earnedIds.has(b.id);
    if (aEarned && !bEarned) return -1;
    if (!aEarned && bEarned) return 1;
    return a.order - b.order;
  });

  const displayedBadges = limit ? sortedBadges.slice(0, limit) : sortedBadges;
  const earnedCount = earnedBadges.length;
  const totalCount = badges.length;

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedBadge(null), 300);
  };

  return (
    <>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-neutral-200 shadow-soft"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-neutral-900">
            Badges Collection
          </h3>
          <span className="text-sm font-semibold text-neutral-600">
            {earnedCount}/{totalCount}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayedBadges.map((badge, index) => {
            const isEarned = earnedIds.has(badge.id);
            const badgeProgress = progress[badge.id];

            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                isEarned={isEarned}
                progress={badgeProgress?.progress}
                total={badgeProgress?.total}
                onClick={() => handleBadgeClick(badge)}
                delay={index * 0.05}
              />
            );
          })}
        </div>

        {showAllButton && limit && badges.length > limit && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/badges')}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 text-white font-semibold shadow-soft-lg hover:bg-primary-600 transition-colors focus-ring"
          >
            <span>Show All Badges</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        )}
      </motion.div>

      <BadgeDetailModal
        badge={selectedBadge}
        isEarned={selectedBadge ? earnedIds.has(selectedBadge.id) : false}
        progress={selectedBadge ? progress[selectedBadge.id]?.progress : 0}
        total={selectedBadge ? progress[selectedBadge.id]?.total : 1}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
