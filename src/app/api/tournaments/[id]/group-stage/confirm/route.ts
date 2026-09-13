import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import { determineQualifiers } from '@/lib/championship/qualifiers';

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
    if (tournament.championshipStatus !== 'group_stage_active') {
      return NextResponse.json(
        { error: 'Tournament must be in group_stage_active to confirm standings' },
        { status: 400 }
      );
    }

    // Verify all group matches are completed
    const groupMatches = tournament.matches.filter((m: any) => m.phase === 'group');
    const incompleteMatches = groupMatches.filter((m: any) => m.status !== 'completed');

    if (incompleteMatches.length > 0) {
      return NextResponse.json(
        {
          error: `${incompleteMatches.length} group match(es) are not yet completed`,
          incompleteCount: incompleteMatches.length,
        },
        { status: 400 }
      );
    }

    const qualificationRules = tournament.qualificationRules ?? {
      gold: [1],
      silver: [2, 3],
      bronze: [4],
    };

    const qualificationSnapshot = determineQualifiers(
      tournament.groups ?? [],
      tournament.teams,
      tournament.matches,
      qualificationRules
    );

    tournament.qualificationSnapshot = qualificationSnapshot as any;
    tournament.championshipStatus = 'group_stage_completed';

    await tournament.save();

    return NextResponse.json({
      message: 'Group stage confirmed',
      qualificationSnapshot,
      championshipStatus: tournament.championshipStatus,
    });
  } catch (error) {
    console.error('Error confirming group stage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
