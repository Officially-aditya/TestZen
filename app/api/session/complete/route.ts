import { NextRequest, NextResponse } from 'next/server';
import { SessionModel } from '@/models/Session';
import { User } from '@/models/User';
import { Garden } from '@/models/Garden';
import { uploadEncryptedReflectionToIPFS } from '@/lib/ipfs';
import { computeHash } from '@/lib/encryption';
import { submitHCSMessage } from '@/lib/hedera';
import dbConnect from '@/lib/mongodb';
import {
  CompleteSessionRequestSchema,
  CompleteSessionResponse,
  ErrorResponse,
} from '@/utils/types';
import { verifySignedProof } from '@/utils/auth';
import { calculateXP, calculateLevel } from '@/utils/xp';
import { updateGardenProgression, getGardenPreview } from '@/utils/garden';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Parse and validate request body
    const body = await req.json();
    const validationResult = CompleteSessionRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Invalid request parameters',
        error: validationResult.error?.errors?.map(e => e.message).join(', '),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const {
      sessionId,
      hederaAccountId,
      mode,
      actualDuration,
      signedProof,
      encryptedReflection,
      reflectionText,
    } = validationResult.data;

    // Find the session
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Session not found',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Verify session belongs to the account
    if (session.hederaAccountId !== hederaAccountId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Session does not belong to this account',
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Verify session is not already completed
    if (session.completed) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Session already completed',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Verify signed proof
    const isProofValid = verifySignedProof(
      signedProof,
      hederaAccountId,
      session.nonce,
      sessionId
    );

    if (!isProofValid) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Invalid signature or proof',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Calculate XP earned
    const xpEarned = calculateXP(actualDuration, mode);

    // Update session with completion data
    const endTime = new Date();
    session.endTime = endTime;
    session.completed = true;
    session.duration = actualDuration;
    session.xpEarned = xpEarned;
    session.signedProof = signedProof;

    // Process encrypted reflection if provided
    if (encryptedReflection) {
      try {
        const hash = await computeHash(encryptedReflection.ciphertext);

        const ipfsPayload = {
          ciphertext: encryptedReflection.ciphertext,
          iv: encryptedReflection.iv,
          salt: encryptedReflection.salt,
          timestamp: endTime.toISOString(),
          mode,
          version: '1.0',
        };

        const cid = await uploadEncryptedReflectionToIPFS(ipfsPayload);

        session.encryptedReflection = {
          ciphertext: encryptedReflection.ciphertext,
          iv: encryptedReflection.iv,
          salt: encryptedReflection.salt,
          hash,
          cid,
        };
      } catch (ipfsError) {
        console.error('IPFS upload error:', ipfsError);
        // Continue without failing - store hash only
        const hash = await computeHash(encryptedReflection.ciphertext);
        session.encryptedReflection = {
          ciphertext: encryptedReflection.ciphertext,
          iv: encryptedReflection.iv,
          salt: encryptedReflection.salt,
          hash,
        };
      }
    }

    // Publish to HCS
    const hcsTopicId = process.env.HEDERA_HCS_TOPIC_ID;
    let hcsMetadata;
    
    if (hcsTopicId) {
      try {
        const hcsResult = await submitHCSMessage(hcsTopicId, {
          sessionId: session._id.toString(),
          userId: session.userId,
          hederaAccountId,
          mode,
          duration: actualDuration,
          xpEarned,
          nonce: session.nonce,
          reflectionHash: session.encryptedReflection?.hash,
          reflectionCID: session.encryptedReflection?.cid,
          timestamp: endTime.toISOString(),
        });

        // Store HCS metadata on session
        session.hcsTopicId = hcsResult.topicId;
        session.hcsSequenceNumber = hcsResult.sequenceNumber;
        session.hcsConsensusTimestamp = hcsResult.timestamp;

        hcsMetadata = {
          topicId: hcsResult.topicId,
          sequenceNumber: hcsResult.sequenceNumber,
          consensusTimestamp: hcsResult.timestamp.toISOString(),
        };

        console.log('HCS message submitted successfully:', hcsMetadata);
      } catch (hcsError) {
        console.error('HCS message submission error:', hcsError);
        // Continue without failing - HCS is optional
      }
    }

    // Save session
    await session.save();

    // Update user stats
    const user = await User.findOne({ hederaAccountId });
    if (!user) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'User not found',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    user.totalXP += xpEarned;
    user.sessionsCompleted += 1;
    user.totalMinutes += actualDuration;
    user.level = calculateLevel(user.totalXP);
    await user.save();

    // Update garden progression
    let garden = await Garden.findOne({ 
      userId: user._id.toString(),
    });

    if (!garden) {
      // Create garden if it doesn't exist (shouldn't happen)
      const { initializeGarden } = await import('@/utils/garden');
      garden = await Garden.create({
        userId: user._id.toString(),
        walletAddress: hederaAccountId,
        tiles: initializeGarden(),
        nftMinted: false,
      });
    }

    const gardenUpdate = updateGardenProgression(garden.tiles, mode);
    garden.tiles = gardenUpdate.tiles;

    // If grid just completed, store completion date
    if (gardenUpdate.isGridComplete && gardenUpdate.completionDate && !garden.nftMetadata) {
      garden.nftMetadata = {
        level: user.level,
        totalXP: user.totalXP,
        completionDate: gardenUpdate.completionDate,
      };
    }

    await garden.save();

    // Prepare response
    const gardenPreview = getGardenPreview(garden);
    
    const response: CompleteSessionResponse = {
      success: true,
      sessionId: session._id.toString(),
      xpEarned,
      totalXP: user.totalXP,
      level: user.level,
      gardenPreview: {
        ...gardenPreview,
        completionDate: gardenPreview.completionDate,
      },
      hcsMetadata,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error completing session:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to complete session',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
