import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Player from '@/models/Player';
import { sendPlayerWelcomeEmail } from '@/lib/email';

// GET – fetch player profile by supabaseId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabaseId = searchParams.get('supabaseId');

    if (!supabaseId) {
      return NextResponse.json({ error: 'supabaseId required' }, { status: 400 });
    }

    await connectDB();
    const player = await Player.findOne({ supabaseId });

    if (!player) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('GET /api/player/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST – create or update player profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      supabaseId,
      email,
      name,
      phone,
      dateOfBirth,
      gender,
      skillLevel,
      yearsOfExperience,
      preferredHand,
      emergencyContactName,
      emergencyContactPhone,
      avatarUrl,
      onboardingCompleted,
    } = body;

    if (!supabaseId || !email || !name) {
      return NextResponse.json(
        { error: 'supabaseId, email and name are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const player = await Player.findOneAndUpdate(
      { supabaseId },
      {
        supabaseId,
        email,
        name,
        phone,
        dateOfBirth,
        gender,
        skillLevel,
        yearsOfExperience,
        preferredHand,
        emergencyContactName,
        emergencyContactPhone,
        avatarUrl,
        onboardingCompleted: onboardingCompleted ?? false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send welcome email only when onboarding is first completed
    if (onboardingCompleted && player && email && name) {
      const isNewlyCompleted = player.onboardingCompleted && !player.wasNew;
      // Fire-and-forget — don't block the response
      sendPlayerWelcomeEmail({ name, email }).catch(() => {});
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('POST /api/player/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
