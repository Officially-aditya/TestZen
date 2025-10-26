import { NextRequest, NextResponse } from 'next/server';

export interface StartSessionRequest {
  userId: string;
  walletAddress?: string;
  mode: string;
  duration: number;
}

export interface StartSessionResponse {
  success: boolean;
  sessionId: string;
  startTime: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: StartSessionRequest = await req.json();
    
    // Validate required fields
    if (!body.userId || !body.mode || !body.duration) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate duration (reasonable limits)
    if (body.duration < 1 || body.duration > 60) {
      return NextResponse.json(
        { success: false, message: 'Duration must be between 1 and 60 minutes' },
        { status: 400 }
      );
    }
    
    // Validate mode
    const validModes = ['calm', 'focus', 'gratitude', 'meditation', 'breathwork'];
    if (!validModes.includes(body.mode.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'Invalid session mode' },
        { status: 400 }
      );
    }
    
    const startTime = new Date();
    
    // Generate a temporary session ID
    // In a real implementation, this would be stored in a database with session state
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Log session start for monitoring
    console.log('Session started:', {
      sessionId,
      userId: body.userId,
      mode: body.mode,
      duration: body.duration,
      startTime: startTime.toISOString(),
    });
    
    const response: StartSessionResponse = {
      success: true,
      sessionId,
      startTime: startTime.toISOString(),
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error starting session:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to start session' 
      },
      { status: 500 }
    );
  }
}
