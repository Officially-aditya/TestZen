import { WalletConnection } from '@/types';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const connectWallet = async (): Promise<WalletConnection> => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not defined');
  }

  if (!window.ethereum) {
    throw new Error('No Ethereum wallet found. Please install MetaMask or another Web3 wallet.');
  }

  try {
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const chainId = await window.ethereum.request({ 
      method: 'eth_chainId' 
    });

    return {
      connected: true,
      address: accounts[0],
      chainId: parseInt(chainId, 16),
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

export const disconnectWallet = (): WalletConnection => {
  return {
    connected: false,
  };
};

export const signMessage = async (message: string, address: string): Promise<string> => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not defined');
  }

  if (!window.ethereum) {
    throw new Error('No Ethereum wallet found');
  }

  try {
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    });

    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};

export const signSessionData = async (
  sessionData: {
    mode: string;
    duration: number;
    startTime: string;
    xpEarned: number;
    reflectionHash?: string;
  },
  address: string
): Promise<string> => {
  const message = JSON.stringify(sessionData, null, 0);
  return signMessage(message, address);
};

export const getWalletConnection = (): WalletConnection => {
  if (typeof window === 'undefined') {
    return { connected: false };
  }

  // Check if already connected
  if (window.ethereum && window.ethereum.selectedAddress) {
    return {
      connected: true,
      address: window.ethereum.selectedAddress,
    };
  }

  return { connected: false };
};
