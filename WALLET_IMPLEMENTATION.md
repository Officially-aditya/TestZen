# HashPack Wallet Connect Implementation

## Overview
This implementation enables users to connect their HashPack wallet to TestZen, allowing them to sign sessions and interact with the Hedera blockchain.

## Features
- ✅ HashPack wallet connection via HashConnect SDK
- ✅ SSR-safe implementation for Next.js
- ✅ Persistent session storage in localStorage
- ✅ Toast notifications for user feedback
- ✅ Account ID display when connected
- ✅ Message signing capability for session verification

## Components

### WalletProvider (`components/wallet/WalletProvider.tsx`)
React Context provider that manages wallet connection state:
- Initializes HashConnect with SSR safeguards (dynamic import)
- Handles pairing flow with HashPack
- Manages connection state and persistence
- Provides signing utilities

### useWallet Hook (`hooks/useWallet.ts`)
Custom hook for accessing wallet context:
```typescript
const { accountId, connected, isConnecting, connect, disconnect, signMessage } = useWallet();
```

### WalletConnect Component (`components/WalletConnect.tsx`)
UI component for wallet connection:
- Connect button with loading states
- Connected state showing account ID
- Disconnect functionality
- Toast notifications for success/error feedback
- Tailwind-styled to match calming design language

## Usage

### In Pages/Components
```typescript
import { useWallet } from '@/hooks/useWallet';

function MyComponent() {
  const { accountId, connected, connect, disconnect } = useWallet();
  
  return (
    <div>
      {connected ? (
        <p>Connected: {accountId}</p>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### Using the WalletConnect Component
```typescript
import WalletConnect from '@/components/WalletConnect';

function MyPage() {
  return (
    <div>
      <WalletConnect />
    </div>
  );
}
```

## Configuration

Add to your `.env` file:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

## Connection Flow

1. User clicks "Connect HashPack" button
2. WalletProvider initializes HashConnect
3. Pairing string is generated
4. HashPack wallet opens (browser extension or app)
5. User approves connection in HashPack
6. Account ID and connection state saved to localStorage
7. UI updates to show connected state

## Disconnect Flow

1. User clicks "Disconnect" button
2. Connection is terminated via HashConnect
3. localStorage is cleared
4. UI updates to show disconnected state

## Persistence

Connection state is persisted in localStorage with key `hashpack_connection_state`:
```typescript
{
  accountId: string;
  network: string;
  topic: string;
  connected: boolean;
}
```

## SSR Safety

The implementation is fully SSR-safe:
- HashConnect is loaded dynamically only on the client
- `typeof window` checks prevent server-side errors
- localStorage is accessed only in the browser
- Provider wraps app in `app/layout.tsx`

## Signing Messages

The wallet context provides a `signMessage` function for signing data:
```typescript
const { signMessage, accountId } = useWallet();

const signature = await signMessage(JSON.stringify(data));
```

This is used in the session page to sign session data for verification.
