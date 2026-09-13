import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    User;

    const tournament = await Tournament.findById(id);
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    if (tournament.tournamentFormat !== 'championship-groups') {
      return NextResponse.json({ error: 'Not a championship-groups tournament' }, { status: 400 });
    }
    if (!['draft', 'registration_closed'].includes(tournament.championshipStatus ?? '')) {
      return NextResponse.json({ error: 'Tournament is not in a state that allows opening registration' }, { status: 400 });
    }

    tournament.championshipStatus = 'registration_open';
    await tournament.save();

    return NextResponse.json({ message: 'Registration opened', championshipStatus: tournament.championshipStatus });
  } catch (error) {
    console.error('Error opening registration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
