import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Garden, IGarden } from '@/models/Garden';
import { SessionModel, ISession } from '@/models/Session';

interface GardenStateResponse {
  success: boolean;
  data?: {
    grid: Array<{
      id: number;
      completed: boolean;
      sessionType?: string;
      completedAt?: string;
    }>;
    xp: {
      total: number;
      level: number;
      currentLevelXP: number;
      nextLevelXP: number;
      progressPercent: number;
    };
    sessions: {
      total: number;
      byMode: {
        meditation: number;
        focus: number;
        breathwork: number;
      };
    };
    badge?: {
      tokenId?: string;
      serialNumber?: string;
      mintedAt?: string;
      level: number;
      totalXP: number;
    };
    nftEligible: boolean;
  };
  message?: string;
}

// Calculate level from total XP using the formula: Level = floor(sqrt(totalXP / 100)) + 1
function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

// Calculate XP required for a specific level
function getXPForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

// Get authentication info from request
function getAuthInfo(request: NextRequest): { userId?: string; walletAddress?: string } {
  const url = new URL(request.url);
  
  // Check query parameters
  const userIdFromQuery = url.searchParams.get('userId');
  const walletFromQuery = url.searchParams.get('walletAddress');
  
  // Check headers
  const userIdFromHeader = request.headers.get('x-user-id');
  const walletFromHeader = request.headers.get('x-wallet-address') || 
                           request.headers.get('authorization')?.replace('Bearer ', '');
  
  return {
    userId: userIdFromQuery || userIdFromHeader || undefined,
    walletAddress: walletFromQuery || walletFromHeader || undefined,
  };
}

// Create a default garden for a user
async function createDefaultGarden(userId: string, walletAddress: string): Promise<IGarden> {
  const defaultTiles = Array.from({ length: 9 }, (_, i) => ({
    id: i,
    completed: false,
  }));
  
  const garden = await Garden.create({
    userId,
    walletAddress,
    tiles: defaultTiles,
    nftMinted: false,
  });
  
  return garden;
}

export async function GET(request: NextRequest) {
  try {
    // Get authentication info
    const { userId, walletAddress } = getAuthInfo(request);
    
    // Require at least one identifier
    if (!userId && !walletAddress) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required. Provide userId or walletAddress.',
        } as GardenStateResponse,
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }
    
    // Connect to database
    await dbConnect();
    
    // Find or create garden
    let garden: IGarden | null = null;
    
    if (walletAddress) {
      garden = await Garden.findOne({ walletAddress });
    } else if (userId) {
      garden = await Garden.findOne({ userId });
    }
    
    // If no garden exists, create a default one
    if (!garden && userId && walletAddress) {
      garden = await createDefaultGarden(userId, walletAddress);
    } else if (!garden && (userId || walletAddress)) {
      // Return default state without creating if we don't have both identifiers
      const defaultGrid = Array.from({ length: 9 }, (_, i) => ({
        id: i,
        completed: false,
      }));
      
      return NextResponse.json(
        {
          success: true,
          data: {
            grid: defaultGrid,
            xp: {
              total: 0,
              level: 1,
              currentLevelXP: 0,
              nextLevelXP: 100,
              progressPercent: 0,
            },
            sessions: {
              total: 0,
              byMode: {
                meditation: 0,
                focus: 0,
                breathwork: 0,
              },
            },
            nftEligible: false,
          },
        } as GardenStateResponse,
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }
    
    // Aggregate session data
    const query: any = {};
    if (walletAddress) {
      query.walletAddress = walletAddress;
    } else if (userId) {
      query.userId = userId;
    }
    
    // Get all completed sessions
    const sessions = await SessionModel.find({ ...query, completed: true }).sort({ endTime: -1 });
    
    // Calculate total XP
    const totalXP = sessions.reduce((sum, session) => sum + session.xpEarned, 0);
    
    // Calculate level and progress
    const level = calculateLevel(totalXP);
    const currentLevelXP = getXPForLevel(level);
    const nextLevelXP = getXPForLevel(level + 1);
    const xpInCurrentLevel = totalXP - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    const progressPercent = Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100));
    
    // Count sessions by mode
    const sessionsByMode = {
      meditation: 0,
      focus: 0,
      breathwork: 0,
    };
    
    sessions.forEach((session: ISession) => {
      const mode = session.mode as keyof typeof sessionsByMode;
      if (mode in sessionsByMode) {
        sessionsByMode[mode]++;
      }
    });
    
    // Format grid data
    const grid = garden!.tiles.map(tile => ({
      id: tile.id,
      completed: tile.completed,
      sessionType: tile.sessionType,
      completedAt: tile.completedAt?.toISOString(),
    }));
    
    // Check NFT eligibility (all 9 tiles completed)
    const nftEligible = garden!.tiles.every(tile => tile.completed) && !garden!.nftMinted;
    
    // Prepare badge data if NFT is minted
    let badge;
    if (garden!.nftMinted && garden!.nftMetadata) {
      badge = {
        tokenId: garden!.nftMetadata.tokenId,
        serialNumber: garden!.nftMetadata.serialNumber,
        mintedAt: garden!.nftMetadata.mintedAt?.toISOString(),
        level: garden!.nftMetadata.level,
        totalXP: garden!.nftMetadata.totalXP,
      };
    }
    
    // Prepare response
    const response: GardenStateResponse = {
      success: true,
      data: {
        grid,
        xp: {
          total: totalXP,
          level,
          currentLevelXP,
          nextLevelXP,
          progressPercent,
        },
        sessions: {
          total: sessions.length,
          byMode: sessionsByMode,
        },
        badge,
        nftEligible,
      },
    };
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Use no-store for sensitive user data by default
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Garden state API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch garden state',
      } as GardenStateResponse,
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
