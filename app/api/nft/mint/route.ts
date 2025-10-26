import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Garden, IGarden } from '@/models/Garden';
import { uploadMetadataToIPFS, BadgeMetadata } from '@/lib/ipfs';
import { mintNFT, validateAccountId } from '@/lib/hedera';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  let gardenDoc: IGarden | null = null;
  let updateAttempted = false;

  try {
    const body = await request.json();
    const { 
      walletAddress, 
      userId, 
      level, 
      totalXP, 
      sessionsCompleted,
      gardenTiles 
    } = body;

    // Validate required fields
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!gardenTiles || !Array.isArray(gardenTiles)) {
      return NextResponse.json(
        { error: 'Garden tiles data is required' },
        { status: 400 }
      );
    }

    // Validate Hedera account ID format
    if (!validateAccountId(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid Hedera account ID format. Expected format: 0.0.xxxxx' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find or create garden document
    gardenDoc = await Garden.findOne({ userId, walletAddress });

    if (!gardenDoc) {
      // Create new garden document
      gardenDoc = new Garden({
        userId,
        walletAddress,
        tiles: gardenTiles,
        nftMinted: false,
      });
      await gardenDoc.save();
    }

    // Check if NFT already minted (idempotency)
    if (gardenDoc.nftMinted) {
      return NextResponse.json(
        {
          error: 'Badge already minted',
          alreadyMinted: true,
          nftMetadata: gardenDoc.nftMetadata,
        },
        { status: 400 }
      );
    }

    // Verify garden grid is complete
    const allTilesComplete = gardenTiles.every(
      (tile: { completed: boolean }) => tile.completed === true
    );

    if (!allTilesComplete) {
      return NextResponse.json(
        { 
          error: 'Garden grid is not complete. All 9 tiles must be completed to mint.',
          eligible: false 
        },
        { status: 400 }
      );
    }

    // Verify minimum sessions requirement
    if (sessionsCompleted < 9) {
      return NextResponse.json(
        { 
          error: 'Insufficient sessions completed. Minimum 9 sessions required.',
          eligible: false 
        },
        { status: 400 }
      );
    }

    // Generate reflection hash (summary of user's journey)
    const reflectionData = `${userId}-${walletAddress}-${totalXP}-${sessionsCompleted}-${level}`;
    const reflectionHash = crypto
      .createHash('sha256')
      .update(reflectionData)
      .digest('hex')
      .substring(0, 16);

    // Generate badge metadata
    const completionDate = new Date();
    const badgeMetadata: BadgeMetadata = {
      name: 'Serenity Badge - Zen Garden Master',
      description: 'A badge of achievement for completing the mindfulness garden journey. This NFT represents dedication to mindfulness and personal growth through 27+ meditation sessions.',
      image: 'ipfs://QmSerenityBadge', // Placeholder - would be actual badge image CID
      attributes: [
        { trait_type: 'Level', value: level },
        { trait_type: 'Total XP', value: totalXP },
        { trait_type: 'Sessions Completed', value: sessionsCompleted },
        { trait_type: 'Rarity', value: 'Legendary' },
        { trait_type: 'Completion Date', value: completionDate.toISOString() },
        { trait_type: 'Journey Hash', value: reflectionHash },
      ],
      level,
      totalXP,
      completionDate: completionDate.toISOString(),
      reflectionHash,
    };

    // Upload metadata to IPFS
    let metadataCID: string;
    try {
      metadataCID = await uploadMetadataToIPFS(badgeMetadata);
    } catch (ipfsError) {
      console.error('IPFS upload failed:', ipfsError);
      return NextResponse.json(
        { error: 'Failed to upload metadata to IPFS. Please try again.' },
        { status: 500 }
      );
    }

    // Mint NFT via Hedera Token Service
    let mintResult;
    try {
      mintResult = await mintNFT(walletAddress, metadataCID);
    } catch (mintError) {
      console.error('Hedera mint failed:', mintError);
      return NextResponse.json(
        { 
          error: 'Failed to mint NFT on Hedera network. Please ensure your account is associated with the token.',
          details: mintError instanceof Error ? mintError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Update garden document with minted NFT data
    try {
      updateAttempted = true;
      gardenDoc.nftMinted = true;
      gardenDoc.tiles = gardenTiles;
      gardenDoc.nftMetadata = {
        tokenId: mintResult.tokenId,
        serialNumber: mintResult.serialNumber.toString(),
        cid: metadataCID,
        transactionId: mintResult.transactionId,
        mintedAt: mintResult.timestamp,
        level,
        totalXP,
        completionDate,
        reflectionHash,
      };
      await gardenDoc.save();
    } catch (dbError) {
      console.error('Database update failed:', dbError);
      // NFT was minted but DB update failed - log this for manual recovery
      console.error('CRITICAL: NFT minted but DB update failed', {
        walletAddress,
        userId,
        tokenId: mintResult.tokenId,
        serialNumber: mintResult.serialNumber,
        transactionId: mintResult.transactionId,
      });
      
      return NextResponse.json(
        { 
          error: 'NFT minted successfully but failed to update records. Please contact support with this transaction ID.',
          transactionId: mintResult.transactionId,
          tokenId: mintResult.tokenId,
          serialNumber: mintResult.serialNumber,
        },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      tokenId: mintResult.tokenId,
      serialNumber: mintResult.serialNumber,
      transactionId: mintResult.transactionId,
      metadataCID,
      metadata: badgeMetadata,
      mintedAt: mintResult.timestamp.toISOString(),
    });

  } catch (error) {
    console.error('Mint error:', error);
    
    // Attempt rollback if we started updating the database
    if (updateAttempted && gardenDoc) {
      try {
        gardenDoc.nftMinted = false;
        gardenDoc.nftMetadata = undefined;
        await gardenDoc.save();
        console.log('Successfully rolled back garden document');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to mint NFT',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
