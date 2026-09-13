import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import { generateGroups, generateGroupMatches, maxTimeSlot } from '@/lib/championship/generateGroups';

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
    if (tournament.championshipStatus !== 'registration_closed') {
      return NextResponse.json(
        { error: 'Registration must be closed before generating groups' },
        { status: 400 }
      );
    }

    const teamsPerGroup = tournament.teamsPerGroup;
    if (!teamsPerGroup) {
      return NextResponse.json({ error: 'teamsPerGroup not configured' }, { status: 400 });
    }

    if (tournament.teams.length < teamsPerGroup) {
      return NextResponse.json(
        { error: `Need at least ${teamsPerGroup} teams. Currently have ${tournament.teams.length}.` },
        { status: 400 }
      );
    }

    // Accepted team indices (all teams in teams[] at this point are accepted)
    const acceptedIndices = tournament.teams.map((_: any, i: number) => i);

    const numCourts: number = tournament.numberOfCourts ?? 1;
    const groups = generateGroups(acceptedIndices, teamsPerGroup);
    const groupMatches = generateGroupMatches(groups, numCourts, 1);

    tournament.groups = groups as any;
    // Replace any existing matches with the freshly scheduled ones
    tournament.matches = groupMatches as any[];
    tournament.status = 'in-progress';
    tournament.championshipStatus = 'group_stage_active';

    await tournament.save();

    return NextResponse.json({
      message: 'Groups generated successfully',
      groups: tournament.groups,
      matchesAdded: groupMatches.length,
      championshipStatus: tournament.championshipStatus,
    });
  } catch (error) {
    console.error('Error generating groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
