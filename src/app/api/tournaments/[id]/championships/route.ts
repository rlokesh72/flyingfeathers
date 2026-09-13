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

// GET — return bracketMatches grouped by championship type, with team names resolved
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';

    if (!isPublic) {
      const user = verifyToken(request);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    User;

    const tournament = await Tournament.findById(id);
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    if (!tournament.bracketMatches || tournament.bracketMatches.length === 0) {
      return NextResponse.json({ gold: [], silver: [], bronze: [] });
    }

    const resolveTeam = (teamIndex: number | undefined) => {
      if (teamIndex === undefined || teamIndex === -1 || teamIndex === null) return null;
      const t = tournament.teams[teamIndex];
      return t ? { index: teamIndex, name: t.name, players: t.players } : null;
    };

    const resolveMatch = (bm: any) => ({
      ...bm.toObject(),
      team1: resolveTeam(bm.team1Index),
      team2: resolveTeam(bm.team2Index),
      winner: resolveTeam(bm.winnerIndex),
    });

    const gold = tournament.bracketMatches.filter((bm: any) => bm.championship === 'gold').map(resolveMatch);
    const silver = tournament.bracketMatches.filter((bm: any) => bm.championship === 'silver').map(resolveMatch);
    const bronze = tournament.bracketMatches.filter((bm: any) => bm.championship === 'bronze').map(resolveMatch);

    return NextResponse.json({ gold, silver, bronze });
  } catch (error) {
    console.error('Error fetching championships:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
