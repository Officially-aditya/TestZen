'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -20, x: '-50%' }}
      className="fixed top-4 left-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-soft-lg max-w-md"
      style={{
        background: type === 'success' ? '#f0fdf4' : '#fef2f2',
        border: type === 'success' ? '2px solid #86efac' : '2px solid #fca5a5',
      }}
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
      )}
      <p className={`text-sm font-medium ${type === 'success' ? 'text-success-900' : 'text-red-900'}`}>
        {message}
      </p>
      <button
        onClick={onClose}
        className="ml-auto p-1 rounded-lg hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function WalletConnect() {
  const { accountId, connected, isConnecting, error, pairingString, connect, disconnect } = useWallet();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [prevConnected, setPrevConnected] = useState(connected);

  // Show toast on connection state changes
  useEffect(() => {
    if (connected && !prevConnected) {
      setToast({ message: 'Wallet connected successfully!', type: 'success' });
    } else if (!connected && prevConnected) {
      setToast({ message: 'Wallet disconnected', type: 'success' });
    }
    setPrevConnected(connected);
  }, [connected, prevConnected]);

  // Show error toast
  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
    }
  }, [error]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const formatAccountId = (id: string) => {
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  };

  if (connected && accountId) {
    return (
      <>
        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-success-50 border-2 border-success-300"
        >
          <CheckCircle className="w-5 h-5 text-success-600" />
          <div className="flex-1">
            <p className="text-xs text-neutral-600">Connected</p>
            <p className="text-sm font-mono font-semibold text-neutral-900">
              {formatAccountId(accountId)}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDisconnect}
            className="text-xs px-3 py-1 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold transition-colors focus-ring"
          >
            Disconnect
          </motion.button>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

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
              <span>Connect HashPack</span>
            </>
          )}
        </motion.button>

        {pairingString && isConnecting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-primary-50 border border-primary-200 rounded-xl"
          >
            <p className="text-xs text-primary-700 mb-2 font-semibold">
              Waiting for approval in HashPack wallet...
            </p>
            <p className="text-xs text-neutral-600">
              If the wallet didn&apos;t open, please approve the connection in your HashPack extension or app.
            </p>
          </motion.div>
        )}

        {error && !isConnecting && (
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
          Connect your HashPack wallet to unlock NFT minting and on-chain features
        </p>
      </div>
    </>
  );
}
