import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, level, totalXP, sessionsCompleted } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    const tokenId = Math.floor(Math.random() * 10000).toString();
    
    const metadata = {
      name: 'Zen Garden Master',
      description: 'A badge of achievement for completing the mindfulness garden journey',
      image: 'ipfs://QmZenGardenBadge',
      attributes: [
        { trait_type: 'Level', value: level || 1 },
        { trait_type: 'Total XP', value: totalXP || 0 },
        { trait_type: 'Sessions', value: sessionsCompleted || 0 },
        { trait_type: 'Rarity', value: 'Legendary' },
      ],
    };

    return NextResponse.json({
      success: true,
      tokenId,
      tokenURI: `ipfs://QmMetadata/${tokenId}`,
      metadata,
      transactionHash: '0x' + Math.random().toString(16).slice(2),
      mintedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Mint error:', error);
    return NextResponse.json(
      { error: 'Failed to mint NFT' },
      { status: 500 }
    );
  }
}
