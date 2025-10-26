'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
  delay?: number;
}

export default function StatsCard({ icon: Icon, label, value, color = 'primary', delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="p-4 sm:p-6 rounded-2xl bg-white border-2 border-neutral-200 shadow-soft hover:shadow-soft-lg transition-shadow"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`p-2 sm:p-3 rounded-xl bg-${color}-100`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${color}-600`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-neutral-600 truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-neutral-900 tabular-nums">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
