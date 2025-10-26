import { NextRequest, NextResponse } from 'next/server';
import { SessionModel } from '@/models/Session';
import { uploadEncryptedReflectionToIPFS } from '@/lib/ipfs';
import { computeHash } from '@/lib/encryption';
import { submitHCSMessage } from '@/lib/hedera';
import dbConnect from '@/lib/mongodb';

export interface CompleteSessionRequest {
  userId: string;
  walletAddress?: string;
  mode: string;
  duration: number;
  startTime: string;
  xpEarned: number;
  encryptedReflection?: {
    ciphertext: string;
    iv: string;
    salt: string;
  };
}

export interface CompleteSessionResponse {
  success: boolean;
  sessionId: string;
  reflectionCID?: string;
  reflectionHash?: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body: CompleteSessionRequest = await req.json();
    
    // Validate required fields
    if (!body.userId || !body.mode || !body.duration || !body.startTime || body.xpEarned === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const endTime = new Date();
    const startTime = new Date(body.startTime);
    
    // Create session document
    const sessionData: any = {
      userId: body.userId,
      walletAddress: body.walletAddress,
      mode: body.mode,
      duration: body.duration,
      startTime,
      endTime,
      completed: true,
      xpEarned: body.xpEarned,
    };
    
    // Process encrypted reflection if provided
    if (body.encryptedReflection) {
      try {
        // Compute hash of ciphertext for integrity verification
        const hash = await computeHash(body.encryptedReflection.ciphertext);
        
        // Prepare payload for IPFS upload
        const ipfsPayload = {
          ciphertext: body.encryptedReflection.ciphertext,
          iv: body.encryptedReflection.iv,
          salt: body.encryptedReflection.salt,
          timestamp: endTime.toISOString(),
          mode: body.mode,
          version: '1.0',
        };
        
        // Upload to IPFS via Web3.storage
        const cid = await uploadEncryptedReflectionToIPFS(ipfsPayload);
        
        // Store encrypted reflection data
        sessionData.encryptedReflection = {
          ciphertext: body.encryptedReflection.ciphertext,
          iv: body.encryptedReflection.iv,
          salt: body.encryptedReflection.salt,
          hash,
          cid,
        };
      } catch (ipfsError) {
        console.error('IPFS upload error:', ipfsError);
        // Continue with session creation even if IPFS upload fails
        // Store the encrypted reflection without CID
        const hash = await computeHash(body.encryptedReflection.ciphertext);
        sessionData.encryptedReflection = {
          ciphertext: body.encryptedReflection.ciphertext,
          iv: body.encryptedReflection.iv,
          salt: body.encryptedReflection.salt,
          hash,
        };
      }
    }
    
    // Create session in database
    const session = await SessionModel.create(sessionData);
    
    // Optionally submit HCS message with reflection hash
    const hcsTopicId = process.env.HEDERA_HCS_TOPIC_ID;
    if (hcsTopicId) {
      try {
        await submitHCSMessage(hcsTopicId, {
          sessionId: session._id.toString(),
          userId: body.userId,
          mode: body.mode,
          duration: body.duration,
          xpEarned: body.xpEarned,
          reflectionHash: sessionData.encryptedReflection?.hash,
          reflectionCID: sessionData.encryptedReflection?.cid,
          timestamp: endTime.toISOString(),
        });
        console.log('HCS message submitted successfully');
      } catch (hcsError) {
        // Log but don't fail the request if HCS submission fails
        console.error('HCS message submission error:', hcsError);
      }
    }
    
    // Prepare response
    const response: CompleteSessionResponse = {
      success: true,
      sessionId: session._id.toString(),
      reflectionCID: sessionData.encryptedReflection?.cid,
      reflectionHash: sessionData.encryptedReflection?.hash,
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to complete session' 
      },
      { status: 500 }
    );
  }
}
