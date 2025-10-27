'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { HashPackConnectionState } from '@/types';

interface WalletContextValue {
  accountId: string | null;
  network: string | null;
  topic: string | null;
  connected: boolean;
  isConnecting: boolean;
  error: string | null;
  pairingString: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<Uint8Array | null>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const STORAGE_KEY = 'hashpack_connection_state';
const APP_METADATA = {
  name: 'TestZen',
  description: 'A calming meditation and focus session tracker',
  icons: ['https://testzen.app/icon.png'],
  url: 'https://testzen.app',
};

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [pairingString, setPairingString] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hashconnect, setHashconnect] = useState<any>(null);

  // Load saved connection state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const state: HashPackConnectionState = JSON.parse(saved);
          if (state.connected && state.accountId) {
            setAccountId(state.accountId);
            setNetwork(state.network);
            setTopic(state.topic);
            setConnected(true);
          }
        } catch (err) {
          console.error('Failed to parse saved wallet state:', err);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, []);

  // Initialize HashConnect (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && !hashconnect) {
      Promise.all([
        import('hashconnect'),
        import('@hashgraph/sdk')
      ]).then(([{ HashConnect }, { LedgerId }]) => {
        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'testzen-project';
        const hc = new HashConnect(
          LedgerId.TESTNET,
          projectId,
          APP_METADATA,
          false
        );
        setHashconnect(hc);
      }).catch(err => {
        console.error('Failed to load HashConnect:', err);
        setError('Failed to initialize wallet connection');
      });
    }
  }, [hashconnect]);

  // Set up event listeners
  useEffect(() => {
    if (!hashconnect) return;

    const handlePairingEvent = (data: any) => {
      if (data.pairingData && data.pairingData.accountIds && data.pairingData.accountIds.length > 0) {
        const newAccountId = data.pairingData.accountIds[0];
        const newNetwork = data.pairingData.network || 'testnet';
        const newTopic = data.topic;

        setAccountId(newAccountId);
        setNetwork(newNetwork);
        setTopic(newTopic);
        setConnected(true);
        setIsConnecting(false);
        setError(null);
        setPairingString(null);

        // Save to localStorage
        const state: HashPackConnectionState = {
          accountId: newAccountId,
          network: newNetwork,
          topic: newTopic,
          pairingString: null,
          connected: true,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    };

    const handleDisconnect = () => {
      setAccountId(null);
      setNetwork(null);
      setTopic(null);
      setConnected(false);
      setIsConnecting(false);
      setPairingString(null);
      localStorage.removeItem(STORAGE_KEY);
    };

    hashconnect.pairingEvent?.on((data: any) => handlePairingEvent(data));
    hashconnect.disconnectionEvent?.on(() => handleDisconnect());

    return () => {
      hashconnect.pairingEvent?.off(handlePairingEvent);
      hashconnect.disconnectionEvent?.off(handleDisconnect);
    };
  }, [hashconnect]);

  const connect = useCallback(async () => {
    if (!hashconnect) {
      setError('HashConnect not initialized');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Initialize connection
      await hashconnect.init();

      // Generate pairing string
      const state = await hashconnect.connect();
      const pairingStr = hashconnect.generatePairingString(
        state,
        APP_METADATA.name,
        false // Don't open HashPack automatically
      );

      setPairingString(pairingStr);

      // Open HashPack with pairing string
      if (typeof window !== 'undefined') {
        const url = `https://wallet.hashpack.app/connect?pairingString=${encodeURIComponent(pairingStr)}`;
        window.open(url, '_blank', 'width=400,height=600');
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      setIsConnecting(false);
      setPairingString(null);
    }
  }, [hashconnect]);

  const disconnect = useCallback(() => {
    if (hashconnect && topic) {
      try {
        hashconnect.disconnect(topic);
      } catch (err) {
        console.error('Failed to disconnect:', err);
      }
    }

    setAccountId(null);
    setNetwork(null);
    setTopic(null);
    setConnected(false);
    setIsConnecting(false);
    setError(null);
    setPairingString(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [hashconnect, topic]);

  const signMessage = useCallback(async (message: string): Promise<Uint8Array | null> => {
    if (!hashconnect || !accountId || !topic) {
      setError('Wallet not connected');
      return null;
    }

    try {
      const encoder = new TextEncoder();
      const messageBytes = encoder.encode(message);
      
      const signature = await hashconnect.sendTransaction(topic, {
        topic,
        byteArray: Array.from(messageBytes),
        metadata: {
          accountToSign: accountId,
          returnTransaction: false,
        },
      });

      return signature;
    } catch (err) {
      console.error('Failed to sign message:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign message');
      return null;
    }
  }, [hashconnect, accountId, topic]);

  const value: WalletContextValue = {
    accountId,
    network,
    topic,
    connected,
    isConnecting,
    error,
    pairingString,
    connect,
    disconnect,
    signMessage,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}
