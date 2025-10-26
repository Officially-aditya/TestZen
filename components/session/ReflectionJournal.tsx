'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';

interface ReflectionJournalProps {
  onSubmit: (reflection: string) => Promise<void>;
  onSkip: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export default function ReflectionJournal({ 
  onSubmit, 
  onSkip, 
  isSubmitting = false,
  error = null 
}: ReflectionJournalProps) {
  const [reflection, setReflection] = useState('');
  const [showGuidance, setShowGuidance] = useState(true);

  const handleSubmit = async () => {
    await onSubmit(reflection);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-success-100 mb-4"
        >
          <Sparkles className="w-8 h-8 text-primary-600" />
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
          Take a Moment to Reflect
        </h2>
        <p className="text-neutral-600 text-sm sm:text-base">
          Capture your thoughts and insights from this session
        </p>
      </div>

      {showGuidance && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-primary-50 border-2 border-primary-200 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900 text-sm mb-1">
                Reflection Guidelines
              </h3>
              <ul className="text-xs text-primary-700 space-y-1">
                <li>• Write from your own experience and authentic feelings</li>
                <li>• Avoid using AI tools to generate your reflection</li>
                <li>• Your reflection will be encrypted and stored securely</li>
                <li>• Be honest - this is for your personal growth</li>
              </ul>
              <button
                onClick={() => setShowGuidance(false)}
                className="text-xs text-primary-600 hover:text-primary-800 underline mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div>
        <label htmlFor="reflection" className="sr-only">
          Your reflection
        </label>
        <textarea
          id="reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="How did this session make you feel? What insights did you gain? What are you grateful for?"
          className="w-full px-4 py-3 rounded-2xl border-2 border-neutral-200 focus:border-primary-500 focus:outline-none resize-none text-neutral-900 placeholder-neutral-400 min-h-[180px] transition-colors"
          disabled={isSubmitting}
          maxLength={2000}
        />
        <div className="flex justify-between items-center mt-2 px-2">
          <p className="text-xs text-neutral-500">
            Optional - Your reflection will be encrypted
          </p>
          <p className="text-xs text-neutral-500">
            {reflection.length}/2000
          </p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">Error submitting reflection</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      <div className="flex gap-3 flex-col sm:flex-row">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSkip}
          className="flex-1 py-3 rounded-2xl bg-neutral-200 text-neutral-700 font-semibold text-base sm:text-lg hover:bg-neutral-300 transition-colors focus-ring"
          disabled={isSubmitting}
        >
          Skip for Now
        </motion.button>
        <motion.button
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          onClick={handleSubmit}
          className="flex-1 py-3 rounded-2xl bg-primary-500 text-white font-semibold text-base sm:text-lg shadow-soft-lg hover:bg-primary-600 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              Saving...
            </span>
          ) : (
            'Save & Continue'
          )}
        </motion.button>
      </div>

      <p className="text-xs text-center text-neutral-400">
        Your reflection is stored encrypted on IPFS for privacy
      </p>
    </motion.div>
  );
}
