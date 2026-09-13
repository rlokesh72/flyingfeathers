import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Player from '@/models/Player';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-jwt-secret-here-change-this-in-production';

function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

// GET /api/admin/players — returns all Player documents (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const players = await Player.find({})
      .select('supabaseId name email skillLevel yearsOfExperience preferredHand onboardingCompleted createdAt gender phone')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ players, total: players.length });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
