import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Garden state retrieved successfully',
    });
  } catch (error) {
    console.error('Garden API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch garden state' },
      { status: 500 }
    );
  }
}
