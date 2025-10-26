'use client';

import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  variant?: 'card' | 'stat' | 'badge' | 'circle';
  className?: string;
}

export default function LoadingSkeleton({ variant = 'card', className = '' }: LoadingSkeletonProps) {
  const baseClass = 'animate-pulse bg-neutral-200 rounded-2xl';

  const variants = {
    card: 'w-full h-32',
    stat: 'w-full h-24',
    badge: 'w-full h-20',
    circle: 'w-20 h-20 rounded-full',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${baseClass} ${variants[variant]} ${className}`}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </motion.div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <LoadingSkeleton variant="stat" />
        <LoadingSkeleton variant="stat" />
        <LoadingSkeleton variant="stat" />
      </div>
      <LoadingSkeleton variant="card" className="h-48" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <LoadingSkeleton variant="badge" />
        <LoadingSkeleton variant="badge" />
        <LoadingSkeleton variant="badge" />
      </div>
    </div>
  );
}
