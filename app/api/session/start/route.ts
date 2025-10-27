import { NextRequest, NextResponse } from 'next/server';
import { SessionModel } from '@/models/Session';
import { User } from '@/models/User';
import { Garden } from '@/models/Garden';
import dbConnect from '@/lib/mongodb';
import { validateAccountId } from '@/lib/hedera';
import { 
  StartSessionRequestSchema, 
  StartSessionResponse,
  ErrorResponse 
} from '@/utils/types';
import { generateNonce } from '@/utils/auth';
import { initializeGarden } from '@/utils/garden';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = StartSessionRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Invalid request parameters',
        error: validationResult.error?.errors?.map(e => e.message).join(', '),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    const { hederaAccountId, mode, targetDuration } = validationResult.data;
    
    // Validate Hedera account ID format
    if (!validateAccountId(hederaAccountId)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Invalid Hedera account ID format',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    // Find or create user
    let user = await User.findOne({ hederaAccountId });
    
    if (!user) {
      // Create new user
      user = await User.create({
        hederaAccountId,
        totalXP: 0,
        level: 1,
        sessionsCompleted: 0,
        totalMinutes: 0,
      });
      
      // Create initial garden for new user
      await Garden.create({
        userId: user._id.toString(),
        walletAddress: hederaAccountId,
        tiles: initializeGarden(),
        nftMinted: false,
      });
    }
    
    // Update last session timestamp
    user.lastSessionAt = new Date();
    await user.save();
    
    // Generate nonce for replay attack prevention
    const nonce = generateNonce();
    const startTime = new Date();
    
    // Create session placeholder
    const session = await SessionModel.create({
      userId: user._id.toString(),
      hederaAccountId,
      mode,
      duration: targetDuration,
      startTime,
      completed: false,
      xpEarned: 0,
      nonce,
    });
    
    // Prepare response
    const response: StartSessionResponse = {
      success: true,
      sessionId: session._id.toString(),
      nonce,
      mode,
      targetDuration,
      startTime: startTime.toISOString(),
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error starting session:', error);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start session',
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
