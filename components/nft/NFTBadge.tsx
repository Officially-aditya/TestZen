'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Lock, Sparkles, Check, ExternalLink } from 'lucide-react';
import { NFTStatus } from '@/types';

interface NFTBadgeProps {
  nftStatus: NFTStatus;
  onMint: () => Promise<void>;
}

export default function NFTBadge({ nftStatus, onMint }: NFTBadgeProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMint = async () => {
    setError(null);
    setIsMinting(true);

    try {
      await onMint();
      setMintSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  if (nftStatus.minted && nftStatus.metadata) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary-50 to-success-50 rounded-3xl shadow-soft-lg p-6 sm:p-8 border-2 border-primary-200"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-success-500 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-900">
                {nftStatus.metadata.name}
              </h3>
              <p className="text-sm text-neutral-600">NFT Badge Minted</p>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-8 h-8 rounded-full bg-success-500 flex items-center justify-center"
          >
            <Check className="w-5 h-5 text-white" />
          </motion.div>
        </div>

        <div className="bg-white/50 rounded-2xl p-4 mb-4">
          <div className="aspect-square bg-gradient-to-br from-primary-100 to-success-100 rounded-xl flex items-center justify-center text-6xl mb-3">
            🏆
          </div>
          <p className="text-sm text-neutral-700 text-center">
            {nftStatus.metadata.description}
          </p>
        </div>

        {nftStatus.tokenId && (
          <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
            <div>
              <p className="text-xs text-neutral-600">Token ID</p>
              <p className="font-mono text-sm font-semibold text-neutral-900">
                #{nftStatus.tokenId}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors focus-ring"
            >
              <span>View on Explorer</span>
              <ExternalLink className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        {nftStatus.metadata.attributes && nftStatus.metadata.attributes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <p className="text-xs font-semibold text-neutral-600 mb-2">Attributes</p>
            <div className="grid grid-cols-2 gap-2">
              {nftStatus.metadata.attributes.map((attr, index) => (
                <div key={index} className="bg-white/50 rounded-lg p-2">
                  <p className="text-xs text-neutral-600">{attr.trait_type}</p>
                  <p className="text-sm font-semibold text-neutral-900">{attr.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  if (nftStatus.eligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary-50 to-success-50 rounded-3xl shadow-soft-lg p-6 sm:p-8 border-2 border-primary-300 relative overflow-hidden"
      >
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-200 to-success-200 rounded-full opacity-30 blur-3xl"
        />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-success-500 flex items-center justify-center animate-pulse-soft">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-900">
                NFT Badge Ready!
              </h3>
              <p className="text-sm text-neutral-600">Mint your achievement</p>
            </div>
          </div>

          <div className="bg-white/50 rounded-2xl p-6 mb-4">
            <div className="aspect-square bg-gradient-to-br from-primary-100 to-success-100 rounded-xl flex items-center justify-center text-6xl mb-4">
              🏆
            </div>
            <h4 className="font-bold text-lg text-neutral-900 mb-2 text-center">
              Zen Garden Master
            </h4>
            <p className="text-sm text-neutral-700 text-center">
              Congratulations! You&apos;ve completed your mindfulness garden. Mint this
              NFT badge to commemorate your achievement and make it yours forever on the
              blockchain.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl"
              >
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMint}
            disabled={isMinting || mintSuccess}
            className={`
              w-full py-4 rounded-2xl font-semibold text-lg shadow-soft-lg
              transition-colors focus-ring flex items-center justify-center gap-2
              ${
                mintSuccess
                  ? 'bg-success-500 text-white'
                  : 'bg-gradient-to-r from-primary-500 to-success-500 text-white hover:from-primary-600 hover:to-success-600'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isMinting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Minting...</span>
              </>
            ) : mintSuccess ? (
              <>
                <Check className="w-5 h-5" />
                <span>Minted Successfully!</span>
              </>
            ) : (
              <>
                <Award className="w-5 h-5" />
                <span>Mint NFT Badge</span>
              </>
            )}
          </motion.button>

          <p className="text-xs text-neutral-500 text-center mt-3">
            This will create a unique NFT on the blockchain representing your achievement
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-neutral-200 flex items-center justify-center">
          <Lock className="w-6 h-6 text-neutral-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-neutral-900">NFT Badge</h3>
          <p className="text-sm text-neutral-600">Locked</p>
        </div>
      </div>

      <div className="bg-neutral-100 rounded-2xl p-6 mb-4">
        <div className="aspect-square bg-neutral-200 rounded-xl flex items-center justify-center text-6xl mb-4 opacity-50">
          🏆
        </div>
        <p className="text-sm text-neutral-600 text-center">
          Complete all 9 tiles in your mindfulness garden to unlock the ability to mint
          your achievement as an NFT badge.
        </p>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-neutral-900 mb-2">
          How to unlock:
        </h4>
        <ul className="space-y-1 text-sm text-neutral-700">
          <li>• Complete 9 meditation sessions</li>
          <li>• Fill all tiles in your garden</li>
          <li>• Connect your wallet</li>
        </ul>
      </div>
    </motion.div>
  );
}
