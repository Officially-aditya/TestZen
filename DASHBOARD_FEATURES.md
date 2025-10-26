# Dashboard UI Features

## Overview

The dashboard experience has been implemented to track XP, garden progress, and NFT badge status. This document outlines the implementation details and features.

## Components Implemented

### 1. GardenGrid Component (`components/garden/GardenGrid.tsx`)

**Purpose**: Renders the 3×3 garden board with animations indicating completed tiles and mint readiness.

**Features**:
- 3×3 grid layout (9 tiles total)
- Dynamic tile states (locked/completed)
- Progressive emoji growth (🌱 → 🌸 → 🌺 → 🌻)
- Subtle animations:
  - Fade-in and scale on mount
  - Gentle pulse and rotation on completed tiles
  - Glowing effect when mint-ready
- Responsive design across all breakpoints
- Completion counter (X/9 tiles)
- Helpful progression text

**Logic**:
- Each tile represents 3 completed sessions
- Tiles unlock progressively as sessions are completed
- Special glow effect appears on the last tile when all are complete

### 2. XPBar Component (`components/garden/XPBar.tsx`)

**Purpose**: Displays total XP, current level, and progress to next level with calm color palette.

**Features**:
- Level display with icon
- Total XP counter
- Animated progress bar
  - Gradient fill (primary-500 to success-500)
  - Shimmer animation effect
  - Smooth width transition
- Current level XP / Required XP display
- XP remaining until next level
- Responsive typography

**Calculations**:
- Current level XP = (level - 1)² × 100
- Next level XP = level² × 100
- Progress percentage for visual bar

### 3. NFTBadge Component (`components/nft/NFTBadge.tsx`)

**Purpose**: Shows badge details (minted vs locked state) and provides mint CTA when eligible.

**States**:

1. **Locked State** (not eligible):
   - Grayscale badge preview
   - Requirements list
   - Helpful instructions

2. **Mint-Ready State** (eligible, not minted):
   - Animated gradient background
   - Rotating glow effect
   - "Zen Garden Master" preview
   - Mint CTA button with loading states
   - Error handling with user-friendly messages

3. **Minted State** (completed):
   - Success indicator
   - Badge metadata display
   - Token ID with view explorer link
   - Attribute grid (Level, XP, Sessions, Rarity)

**Integration**:
- Calls `/api/nft/mint` endpoint
- Updates state on successful mint
- Displays token metadata
- Handles errors gracefully

### 4. WalletConnect Component (`components/WalletConnect.tsx`)

**Purpose**: Manages wallet connection with helpful prompts.

**Features**:
- Connect button with loading state
- Connected state display:
  - Truncated address (0x1234...5678)
  - Green success indicator
  - Disconnect option
- Error handling with descriptive messages
- Responsive layout

**Mock Implementation**:
- Simulates wallet connection (1s delay)
- Generates mock wallet address
- Stores connection state in user stats

### 5. Dashboard Page (`app/dashboard/page.tsx`)

**Purpose**: Main dashboard view composing all features.

**Layout**:

**Header Section**:
- Title and description
- Wallet connection component
- "New Session" CTA button
- Back navigation to home

**Wallet Gating Banner**:
- Displays when wallet not connected
- Explains benefits of wallet connection
- Encourages connection for NFT features

**Content Grid** (3-column responsive):

**Left Column (2/3 width)**:
1. XP Progress Bar
2. Garden Grid (3×3 tiles)
3. Recent Sessions list
   - Last 5 sessions
   - Mode icon (🧘/🎯/💨)
   - Date and time
   - Duration and XP earned

**Right Column (1/3 width)**:
- NFT Badge status and minting

**Empty State**:
- Welcome message for first-time users
- Call-to-action to start first session
- Encouraging copy

**Features**:
- Client-side data fetching
- Auto-refresh garden tiles based on sessions
- Auto-update NFT eligibility
- Smooth Framer Motion transitions
- Responsive breakpoints (mobile/tablet/desktop)
- Loading skeleton states

## API Routes

### 1. NFT Mint API (`app/api/nft/mint/route.ts`)

**Endpoint**: POST `/api/nft/mint`

**Request Body**:
```json
{
  "walletAddress": "0x...",
  "level": 5,
  "totalXP": 2500,
  "sessionsCompleted": 27
}
```

**Response**:
```json
{
  "success": true,
  "tokenId": "1234",
  "tokenURI": "ipfs://QmMetadata/1234",
  "transactionHash": "0x...",
  "mintedAt": "2024-01-01T00:00:00.000Z",
  "metadata": {
    "name": "Zen Garden Master",
    "description": "...",
    "image": "ipfs://QmZenGardenBadge",
    "attributes": [...]
  }
}
```

**Mock Behavior**:
- 1.5s simulated delay
- Generates random token ID
- Creates metadata with user stats
- Returns success with full NFT details

### 2. Garden API (`app/api/garden/route.ts`)

**Endpoint**: GET `/api/garden`

**Purpose**: Placeholder for future garden state syncing

**Response**:
```json
{
  "success": true,
  "message": "Garden state retrieved successfully"
}
```

## Data Flow

### Session Completion → Garden Update:

1. User completes session
2. `updateGardenTiles()` called
   - Calculates completed tiles: `Math.floor(sessionsCompleted / 3)`
   - Updates tile states in garden array
3. `updateNFTStatus()` called
   - Checks if all 9 tiles completed
   - Updates eligibility flag
4. Stats saved to localStorage
5. Dashboard reflects new state on next visit

### NFT Minting Flow:

1. User visits dashboard
2. System checks eligibility (9 tiles complete + 27 sessions)
3. If eligible, "Mint" button appears
4. User connects wallet (if not connected)
5. User clicks "Mint NFT Badge"
6. Loading state displayed
7. POST request to `/api/nft/mint`
8. Success → metadata displayed
9. Failure → error message shown

## Responsive Design

### Mobile (< 640px):
- Single column layout
- Stacked wallet connect and CTA
- Full-width components
- Touch-friendly button sizes (min 44px)
- Smaller text scales (text-sm)

### Tablet (640px - 1024px):
- Two column layout where appropriate
- Optimized spacing (p-6)
- Medium text scales (text-base)

### Desktop (> 1024px):
- Three column layout
- Spacious padding (p-8)
- Larger text scales (text-xl, text-2xl)
- Side-by-side button groups

## Animation Details

### Garden Grid:
- Staggered tile entrance (50ms delay per tile)
- Completed tiles: gentle scale + rotate loop (2s duration, 3s delay)
- Mint-ready: pulsing gradient glow effect
- Lock icon fade for incomplete tiles

### XP Bar:
- Progress bar width animation (1s ease-out)
- Shimmer sweep effect (2s linear loop)
- Number counter animation on load

### NFT Badge:
- Rotating background gradient (20s)
- Pulse animation on sparkles
- Mint button loading spinner (360° rotation)
- Success checkmark pop-in

### Dashboard:
- Page elements stagger in (0.1-0.4s delays)
- Fade + slide up entrance
- Session list items stagger (50ms per item)

## Accessibility

### Keyboard Navigation:
- All buttons focusable
- Logical tab order
- Enter/Space to activate

### Screen Readers:
- Semantic HTML structure
- ARIA labels on interactive elements
- Alt text for visual indicators
- Status updates announced

### Visual:
- WCAG AA contrast ratios
- Focus rings (2px primary-500)
- Clear button states
- Large touch targets (44px minimum)

### Motion:
- Respects `prefers-reduced-motion`
- Essential animations only
- Reduced duration fallbacks

## User Experience

### Progressive Disclosure:
- Features unlock as user progresses
- Clear requirements shown when locked
- Celebration when milestones reached

### Error Handling:
- Graceful fallbacks
- Clear error messages
- Retry options
- No data loss on error

### Performance:
- Optimistic UI updates
- Loading states for async operations
- Skeleton loaders prevent layout shift
- Client-side caching (localStorage)

### Feedback:
- Visual confirmation of actions
- Progress indicators for operations
- Success states with celebration
- Encouraging copy throughout

## Integration with Existing App

### Home Page:
- Added "Dashboard" button in header
- Links to `/dashboard` route
- Maintains existing functionality

### Session Page:
- Updated to call `updateGardenTiles()`
- Updated to call `updateNFTStatus()`
- Garden state persists after sessions

### Storage Layer:
- Extended `UserStats` interface
- Added `GardenTile`, `NFTStatus`, `WalletConnection` types
- New utility functions in `lib/storage.ts`
- Backward compatible with existing data

## Future Enhancements

Potential additions:
- Real Web3 wallet integration (MetaMask, WalletConnect)
- Actual NFT smart contract deployment
- IPFS image uploads for badge
- On-chain transaction verification
- Social sharing of NFT badges
- Leaderboard with other users
- Additional badge tiers (silver, gold, platinum)
- Animated NFT with growth stages
- Marketplace integration
