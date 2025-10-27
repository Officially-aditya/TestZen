# TestZen - Mindful Focus Sessions Tracker

A calming meditation and focus session tracker with XP rewards, badge collection, and a beautiful mindfulness garden visualization. Built with Next.js, TypeScript, Tailwind CSS, and Framer Motion.

## Features

- 🧘 **Multiple Session Modes**: Meditation, Focus, and Breathwork
- ⏱️ **Flexible Durations**: Choose from 5 to 60 minutes
- 🎯 **XP & Leveling System**: Earn experience points and level up
- 🏆 **Badge Collection**: Unlock achievements as you progress
- 🌱 **Mindfulness Garden**: Watch your garden grow with each session (3×3 tile grid)
- 🖼️ **NFT Badge Minting**: Mint your achievement as an NFT badge when garden is complete
- 👛 **Wallet Connection**: Connect your wallet for on-chain features
- 📊 **Advanced Dashboard**: Track XP progress, garden tiles, and NFT status
- 📅 **Session History**: View recent sessions with detailed metrics
- ✨ **Smooth Animations**: Gentle transitions with Framer Motion
- 📱 **Fully Responsive**: Mobile-first design that works on all devices
- ♿ **Accessible**: WCAG compliant with focus indicators and ARIA labels
- 🎨 **Calming Aesthetic**: Soft colors, rounded corners, and gentle shadows
- 🌟 **Starfield Background**: Beautiful animated starfield canvas

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Storage**: LocalStorage (client-side)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Officially-aditya/TestZen.git
cd TestZen
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Starting a Session

1. Click "Start Session" from the dashboard
2. Select your practice mode (Meditation, Focus, or Breathwork)
3. Choose your session duration (5-60 minutes)
4. Click "Begin Session" to start the timer
5. Use Play/Pause controls during your session
6. Receive XP and check for new badges upon completion

### Dashboard Overview

The app has two main views:

**Home Page** (`/`):
- **Stats Cards**: Level, Total XP, Total Minutes, and Sessions Completed
- **Mindfulness Garden**: Visual representation of your progress
- **Badge Collection**: All available badges (locked and unlocked)

**Advanced Dashboard** (`/dashboard`):
- **Wallet Connection**: Connect your wallet for NFT features
- **XP Progress Bar**: Detailed view of XP and progress to next level
- **Garden Grid**: 3×3 tile grid showing session completion (1 tile per 3 sessions)
- **NFT Badge Status**: View mint eligibility and mint your achievement badge
- **Recent Sessions**: Timeline of your last 5 completed sessions
- **Session Analytics**: Duration, XP earned, and timestamps

### Earning XP and Badges

- **XP Calculation**: 10 XP per minute (with mode multipliers)
  - Meditation: 1.2x multiplier
  - Breathwork: 1.1x multiplier
  - Focus: 1.0x multiplier
- **Level Formula**: Level = floor(sqrt(totalXP / 100)) + 1

**Available Badges**:
- 🌱 **First Steps** (Common): Complete your first session
- 🌿 **Dedicated** (Common): Complete 10 sessions
- ⏱️ **Centurion** (Rare): Meditate for 100 minutes
- ⭐ **Rising Star** (Rare): Reach level 5
- 🧘 **Zen Master** (Epic): Reach level 10

### NFT Badge System

Complete all 9 tiles in your mindfulness garden (27 total sessions) to become eligible to mint an NFT badge using **Hedera Token Service (HTS)**:

1. **Complete Sessions**: Each session contributes to your garden progress
2. **Fill Garden Grid**: Complete all 9 tiles (3 sessions per tile = 27 sessions)
3. **Connect Wallet**: Link your Hedera wallet to enable minting
4. **Associate Token**: Associate the Serenity Badge token with your account (one-time, ~$0.05)
5. **Mint NFT**: Mint your "Serenity Badge - Zen Garden Master" achievement
6. **View On-Chain**: Your badge is stored on Hedera with metadata on IPFS

**The NFT badge includes:**
- Unique token ID and serial number
- Level and XP metadata
- Total sessions completed
- Completion date and timestamp
- Journey reflection hash (unique fingerprint)
- Legendary rarity status
- IPFS-hosted metadata

**Technical Features:**
- ✅ Idempotent minting (prevents duplicates)
- ✅ Server-side signing for security
- ✅ Graceful error handling and rollback
- ✅ Metadata stored permanently on IPFS
- ✅ Transaction verification on Hedera
- ✅ Comprehensive test coverage

For setup and configuration, see:
- [NFT_MINTING_IMPLEMENTATION.md](./NFT_MINTING_IMPLEMENTATION.md) - Technical details
- [HEDERA_SETUP.md](./HEDERA_SETUP.md) - Setup guide

## Design System

### Color Palette

- **Primary**: Blue tones for interactive elements
- **Neutral**: Gray tones for text and backgrounds
- **Success**: Green tones for positive feedback

### Typography

- **Font**: Inter (system fallback to sans-serif)
- **Headings**: Bold, display font
- **Body**: Regular weight, good readability

### Spacing & Layout

- **Border Radius**: 2xl (1rem) for consistent rounded corners
- **Shadows**: Soft shadows for depth without harshness
- **Spacing**: 4px base unit, responsive scaling

### Responsive Breakpoints

- **Mobile**: 375px - 639px
- **Tablet**: 640px - 1023px
- **Desktop**: 1024px+

## Accessibility

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Focus indicators on all focusable elements
- Logical tab order through the interface

### Screen Readers

- Semantic HTML structure
- ARIA labels for timers and controls
- Live regions for dynamic content updates

### Visual Accessibility

- WCAG AA compliant color contrast
- Clear focus indicators (2px ring)
- Reduced motion support via `prefers-reduced-motion`

### Reduced Motion

Users with motion sensitivity can enable "Reduce Motion" in their system preferences, which will:
- Disable complex animations
- Reduce transition durations
- Maintain functionality without motion

## Project Structure

```
/
├── app/
│   ├── api/
│   │   ├── garden/
│   │   │   └── route.ts    # Garden API endpoint
│   │   ├── health/
│   │   │   └── route.ts    # Health check endpoint
│   │   ├── nft/
│   │   │   └── mint/
│   │   │       └── route.ts # NFT minting API
│   │   └── session/        # Session management APIs
│   ├── dashboard/
│   │   └── page.tsx        # Advanced dashboard page
│   ├── session/
│   │   └── page.tsx        # Session page
│   ├── layout.tsx          # Root layout with metadata
│   ├── globals.css         # Global styles and Tailwind
│   └── page.tsx            # Home page
├── components/
│   ├── garden/
│   │   ├── GardenGrid.tsx  # 3×3 garden tile grid
│   │   └── XPBar.tsx       # XP progress bar
│   ├── nft/
│   │   └── NFTBadge.tsx    # NFT badge status and minting
│   ├── Starfield.tsx       # Animated background canvas
│   ├── ModeSelector.tsx    # Session mode selection
│   ├── DurationSelector.tsx # Duration selection
│   ├── SessionTimer.tsx    # Timer with controls
│   ├── XPGainAnimation.tsx # XP gain celebration
│   ├── BadgeUnlocked.tsx   # Badge unlock celebration
│   ├── StatsCard.tsx       # Dashboard stat card
│   ├── GardenVisualization.tsx # Garden display
│   ├── BadgeGrid.tsx       # Badge collection grid
│   ├── WalletConnect.tsx   # Wallet connection UI
│   └── LoadingSkeleton.tsx # Loading states
├── lib/
│   ├── encryption.ts       # Encryption utilities
│   ├── hedera.ts           # Hedera client & HCS/HTS helpers
│   ├── ipfs.ts             # Web3.storage client factory
│   ├── mongodb.ts          # MongoDB cached connection
│   ├── storage.ts          # LocalStorage utilities
│   └── wallet.ts           # Wallet connection helpers
├── models/
│   └── Garden.ts           # Garden document schema
├── utils/
│   ├── auth.ts             # Authentication utilities
│   ├── constants.ts        # Shared constants and enums
│   ├── garden.ts           # Garden calculation helpers
│   ├── types.ts            # Core TypeScript interfaces
│   └── xp.ts               # XP calculation helpers
├── types/
│   └── index.ts            # Additional type definitions
├── public/                 # Static assets
├── .env.example            # Environment variables template
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js recommended config
- Consistent naming: camelCase for variables, PascalCase for components
- Functional components with hooks

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Deploy with default settings

### Other Platforms

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

### Environment Variables

Configure the following environment variables for full functionality:

```bash
# Copy example file
cp .env.example .env
```

#### Required Variables

**MongoDB (Database):**
- `MONGODB_URI` - MongoDB connection string
  - Get from: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or use local MongoDB
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/testzen`

**Hedera (Blockchain):**
- `HEDERA_NETWORK` - Network to use (`testnet` or `mainnet`)
- `HEDERA_OPERATOR_ID` - Your Hedera account ID (format: `0.0.xxxxx`)
  - Get from: [Hedera Portal](https://portal.hedera.com) (testnet) or [Hedera.com](https://hedera.com) (mainnet)
- `HEDERA_OPERATOR_KEY` - Your Hedera private key (DER encoded hex string)
- `HEDERA_NFT_TOKEN_ID` - NFT token/collection ID (format: `0.0.xxxxx`)
  - Create using: Hedera Token Service (HTS) API
- `HEDERA_HCS_TOPIC_ID` - Consensus topic ID (format: `0.0.xxxxx`)
  - Create using: Hedera Consensus Service (HCS) API

**Web3.storage (IPFS):**
- `WEB3_STORAGE_TOKEN` - API token for Web3.storage
  - Get from: [https://web3.storage](https://web3.storage)
  - Used for: Uploading encrypted reflections and NFT metadata to IPFS

**Encryption (Server-side - Keep Secret!):**
- `ENCRYPTION_BASE_KEY` - Base encryption key (32 bytes base64)
  - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- `ENCRYPTION_SALT` - Salt for key derivation (32 bytes base64)
  - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- `ENCRYPTION_PEPPER` - Additional encryption security (32 bytes base64)
  - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

**JWT/Authentication (Server-side - Keep Secret!):**
- `JWT_SECRET` - Secret for signing authentication tokens (64 bytes base64)
  - Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"`
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (64 bytes base64, different from JWT_SECRET)
  - Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"`

#### Optional Variables

**IPFS (Local Node):**
- `IPFS_HOST` - IPFS node host (default: `localhost`)
- `IPFS_PORT` - IPFS node port (default: `5001`)
- `IPFS_PROTOCOL` - Protocol to use (default: `http`)
- `IPFS_GATEWAY` - IPFS gateway URL (default: `https://ipfs.io/ipfs`)

**Client-side:**
- `NEXT_PUBLIC_ENCRYPTION_BASE_KEY` - Client-side encryption base key
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
  - Get from: [https://cloud.walletconnect.com](https://cloud.walletconnect.com)
- `NEXT_PUBLIC_APP_URL` - Application URL (default: `http://localhost:3000`)
- `NEXT_PUBLIC_API_URL` - API base URL (default: `http://localhost:3000/api`)

#### Health Check

After setting up environment variables, verify your configuration:

```bash
# Start the development server
npm run dev

# Check health status
curl http://localhost:3000/api/health
```

The health endpoint will report the status of:
- MongoDB connection
- Hedera client configuration
- Web3.storage token configuration

See [HEDERA_SETUP.md](./HEDERA_SETUP.md) for detailed Hedera setup instructions.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- Skeleton loading states prevent layout shifts
- Optimized animations with `will-change` and GPU acceleration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC License

## Acknowledgments

- Design inspired by calm and minimalist meditation apps
- Icons by Lucide React
- Animations powered by Framer Motion

---

Built with 💙 for mindful focus and productivity
