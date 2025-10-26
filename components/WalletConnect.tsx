'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { WalletConnection } from '@/types';

interface WalletConnectProps {
  walletConnection: WalletConnection;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
}

export default function WalletConnect({
  walletConnection,
  onConnect,
  onDisconnect,
}: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      await onConnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (walletConnection.connected && walletConnection.address) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-success-50 border-2 border-success-300"
      >
        <CheckCircle className="w-5 h-5 text-success-600" />
        <div className="flex-1">
          <p className="text-xs text-neutral-600">Connected</p>
          <p className="text-sm font-mono font-semibold text-neutral-900">
            {formatAddress(walletConnection.address)}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDisconnect}
          className="text-xs px-3 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold transition-colors focus-ring"
        >
          Disconnect
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors shadow-soft focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="w-5 h-5" />
            <span>Connect Wallet</span>
          </>
        )}
      </motion.button>

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

      <p className="text-xs text-neutral-500 text-center">
        Connect your wallet to unlock NFT minting and on-chain features
      </p>
    </div>
  );
}
