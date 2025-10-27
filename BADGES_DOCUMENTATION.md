# Badge System Documentation

## Overview

The TestZen badge system has been expanded from 5 to 20 badges, organized into 5 categories with varied achievement types. The homepage displays 8 featured badges with a "Show All" button that navigates to a dedicated badges page.

## Badge Categories

### Foundation Badges (3)
1. **First Light** - Complete first session (🌱)
2. **Garden Keeper** - Complete 3×3 grid (🪷)
3. **Consistent Soul** - 7 day streak (🔥)

### Session Mode Badges (6)
4. **Calm Master** - 10 Calm sessions (🌸)
5. **Focus Champion** - 10 Focus sessions (🎯)
6. **Gratitude Guru** - 10 Gratitude sessions (🙏)
7. **Balanced Mind** - 5 sessions in each mode (⚖️)
8. **Mode Explorer** - Try all 3 modes (🧭)
9. **Deep Practice** - 20 total sessions (🍃)

### Time-Based Badges (4)
10. **Morning Zen** - Complete 5 morning sessions before 10am (🌅)
11. **Night Owl** - Complete 5 evening sessions after 8pm (🌙)
12. **Weekend Warrior** - 10 weekend sessions (🎋)
13. **Weekday Dedicated** - 10 weekday sessions (📅)

### Milestone Badges (4)
14. **XP Novice** - Reach 500 XP (⭐)
15. **XP Adept** - Reach 1500 XP (✨)
16. **XP Master** - Reach 3000 XP (💫)
17. **Level 5 Sage** - Reach level 5 (🧘)

### Special Achievement Badges (3)
18. **Marathon Meditator** - Complete a 15+ minute custom session (🏃)
19. **Reflection Writer** - Write 10 reflections over 100 words (✍️)
20. **Peace Ambassador** - Invite 3 friends - coming soon (🕊️)

## Technical Implementation

### File Structure

```
/lib/badges.ts                     # Badge definitions and helpers
/utils/badgeTracker.ts             # Badge progress calculation and tracking
/components/badges/
  ├── BadgeCard.tsx                # Individual badge display component
  └── BadgeDetailModal.tsx         # Badge detail popup modal
/components/BadgeGrid.tsx          # Grid display with limit and filter support
/app/badges/page.tsx               # Dedicated badges page
```

### Key Features

1. **Progress Tracking**: Each badge shows real-time progress (e.g., "5/10 sessions")
2. **Visual States**:
   - Locked: Grayscale with lock icon + progress bar
   - Earned: Full color with badge icon + earned date
   - New: Pulsing "New!" indicator
3. **Filtering**: Category and status filters on badges page
4. **Responsive**: Adaptive grid layouts for mobile/tablet/desktop

### Badge Data Model

```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'foundation' | 'mode' | 'time' | 'milestone' | 'special';
  color: string;
  requirement: {
    type: string;
    count?: number;
    mode?: string;
    // ... other requirement fields
  };
  order: number;
  earnedAt?: Date;
}
```

### Badge Requirement Types

- `sessions_completed`: Total sessions count
- `garden_completed`: Garden tiles completion
- `streak`: Consecutive day streak
- `mode_sessions`: Sessions in specific mode
- `balanced_modes`: Minimum sessions in all modes
- `try_all_modes`: At least one session in all modes
- `time_of_day`: Sessions at specific time (morning/evening)
- `day_type`: Sessions on weekends/weekdays
- `xp_milestone`: Total XP threshold
- `level_milestone`: User level threshold
- `long_session`: Single session duration
- `reflections`: Reflection count with word minimum
- `social_invite`: Friend invites (placeholder)

### Usage Example

```typescript
import { ALL_BADGES } from '@/lib/badges';
import { getAllBadgesWithProgress } from '@/utils/badgeTracker';

// Get all badges with progress
const stats = getUserStats();
const sessions = getSessions();
const badgesWithProgress = getAllBadgesWithProgress(stats, sessions);

// Check for newly earned badges
const newBadges = checkForNewBadges(stats, sessions);
```

## Design Specifications

### Category Colors
- Foundation: #A8CABA (muted green)
- Mode: #F4EDE4 (sand beige)
- Time: #8FA3BF (soft blue)
- Milestone: #D4AF97 (warm tan)
- Special: #C5A7C4 (lavender)

### Rarity Colors
- Common: Neutral gray gradient
- Rare: Primary color gradient
- Epic: Purple gradient
- Legendary: Amber/gold gradient

### Animations
- Badge unlock: Scale + rotate animation
- Progress bars: Animated width transition
- Earned badges: Subtle pulse animation
- Modal: Scale + fade transition

## Future Enhancements

1. **Social Features**: Enable Peace Ambassador badge with friend invites
2. **Reflection Tracking**: Implement word count tracking for Reflection Writer badge
3. **Streak Notifications**: Daily reminders to maintain streaks
4. **Badge Sharing**: Social media sharing functionality
5. **Custom Badges**: User-created achievement goals
6. **Seasonal Badges**: Limited-time event badges
7. **Badge Analytics**: Detailed statistics and insights

## Migration Notes

Old badge IDs are automatically migrated:
- `first_session` → `first_light`
- `ten_sessions` → `deep_practice`
- `hundred_minutes` → `xp_novice`
- `level_five` → `level_five_sage`
- `level_ten` → `xp_adept`
