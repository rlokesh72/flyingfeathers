import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import { generateChampionshipBrackets } from '@/lib/championship/generateBrackets';
import { generateMensOpeningStage, splitQualifiersByCategory } from '@/lib/championship/mensFormat';

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
    const canStart = tournament.championshipStatus === 'group_stage_completed';
    const alreadyGenerated = ['knockouts_active', 'knockouts_generated'].includes(tournament.championshipStatus ?? '');
    const champScored = (tournament.matches ?? []).some(
      (m: any) => m.phase && m.phase !== 'group' && m.status === 'completed'
    );
    const canRegenerate = alreadyGenerated && (tournament.isSimulation || !champScored);

    if (!canStart && !canRegenerate) {
      return NextResponse.json(
        { error: champScored
          ? 'Championship scores already exist. Use a test copy to regenerate.'
          : 'Group stage must be confirmed before generating championship matches' },
        { status: 400 }
      );
    }
    if (!tournament.qualificationSnapshot || tournament.qualificationSnapshot.length === 0) {
      return NextResponse.json({ error: 'No qualification snapshot found' }, { status: 400 });
    }

    if (canRegenerate) {
      tournament.matches = (tournament.matches ?? []).filter((m: any) => m.phase === 'group') as any;
      tournament.bracketMatches = [] as any;
    }

    const numCourts: number = tournament.numberOfCourts ?? 1;
    const groupMaxSlot = tournament.matches.reduce(
      (max: number, m: any) => Math.max(max, m.timeSlot ?? 0), 0
    );
    let nextSlot = groupMaxSlot + 1;
    let nextIndex = tournament.matches.length;

    const { men, women } = splitQualifiersByCategory(
      tournament.qualificationSnapshot as any[],
      tournament.groups ?? []
    );

    const allBracket: any[] = [];
    const allGlobal: any[] = [];

    if (men.length) {
      const mens = generateMensOpeningStage(men, nextIndex, numCourts, nextSlot);
      allBracket.push(...mens.bracketMatches);
      allGlobal.push(...mens.globalMatches);
      nextIndex += mens.globalMatches.length;
      nextSlot = mens.bracketMatches.reduce((max, m) => Math.max(max, m.timeSlot ?? 0), nextSlot - 1) + 1;
    }

    if (women.length) {
      const womens = generateChampionshipBrackets(
        women,
        tournament.teams,
        nextIndex,
        numCourts,
        nextSlot
      );
      allBracket.push(...womens.bracketMatches);
      allGlobal.push(...womens.globalMatches);
    }

    tournament.bracketMatches = allBracket;
    tournament.matches.push(...allGlobal);
    tournament.championshipStatus = 'knockouts_active';

    await tournament.save();

    return NextResponse.json({
      message: 'Championship matches generated',
      bracketMatchCount: allBracket.length,
      globalMatchesAdded: allGlobal.length,
      championshipStatus: tournament.championshipStatus,
    });
  } catch (error) {
    console.error('Error generating championship brackets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
