import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import { generateChampionshipBrackets } from '@/lib/championship/generateBrackets';

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
    if (tournament.championshipStatus !== 'group_stage_completed') {
      return NextResponse.json(
        { error: 'Group stage must be confirmed before generating championship brackets' },
        { status: 400 }
      );
    }
    if (!tournament.qualificationSnapshot || tournament.qualificationSnapshot.length === 0) {
      return NextResponse.json({ error: 'No qualification snapshot found' }, { status: 400 });
    }

    const numCourts: number = tournament.numberOfCourts ?? 1;
    // Championships start one session after the last group match
    const groupMaxSlot = tournament.matches.reduce(
      (max: number, m: any) => Math.max(max, m.timeSlot ?? 0), 0
    );
    const champStartSlot = groupMaxSlot + 1;

    const { bracketMatches, globalMatches } = generateChampionshipBrackets(
      tournament.qualificationSnapshot as any[],
      tournament.teams,
      tournament.matches.length,
      numCourts,
      champStartSlot
    );

    tournament.bracketMatches = bracketMatches as any[];
    tournament.matches.push(...(globalMatches as any[]));
    tournament.championshipStatus = 'knockouts_active';

    await tournament.save();

    return NextResponse.json({
      message: 'Championship brackets generated',
      bracketMatchCount: bracketMatches.length,
      globalMatchesAdded: globalMatches.length,
      championshipStatus: tournament.championshipStatus,
    });
  } catch (error) {
    console.error('Error generating championship brackets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
