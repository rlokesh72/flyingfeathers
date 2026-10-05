import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import { calculateGroupStandings } from '@/lib/championship/standings';
import { normalizeGroupCategory } from '@/lib/championship/qualification';

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

// GET — return groups with live standings
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
    if (isPublic && tournament.isSimulation) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (!tournament.groups || tournament.groups.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    const groupsWithStandings = tournament.groups.map((group: any) => {
      const standings = calculateGroupStandings(group, tournament.teams, tournament.matches);
      return { ...group.toObject(), standings };
    });

    return NextResponse.json({ groups: groupsWithStandings });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function groupLabel(index: number) {
  return index < 26
    ? `Group ${String.fromCharCode(65 + index)}`
    : `Group ${index + 1}`;
}

// PUT — save a draft group draw (auth required). Matches are not generated yet.
export async function PUT(
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
        { error: 'Groups can only be arranged after registration is closed and before matches are generated' },
        { status: 400 }
      );
    }

    const { groups } = await request.json();
    if (!Array.isArray(groups)) {
      return NextResponse.json({ error: 'groups must be an array' }, { status: 400 });
    }

    const teamCount = tournament.teams.length;
    const seen = new Set<number>();
    const normalized = [];
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const teamIndices = (g.teamIndices ?? [])
        .map((n: any) => Number(n))
        .filter((n: number) => Number.isInteger(n) && n >= 0 && n < teamCount);
      for (const n of teamIndices) {
        if (seen.has(n)) {
          return NextResponse.json({ error: 'A team cannot appear in more than one group' }, { status: 400 });
        }
        seen.add(n);
      }
      const name = String(g.name || groupLabel(i)).trim() || groupLabel(i);
      normalized.push({
        name,
        sequence: i,
        teamIndices,
        category: normalizeGroupCategory(g.category, name),
      });
    }

    tournament.groups = normalized as any;
    tournament.numberOfGroups = normalized.length;
    await tournament.save();

    return NextResponse.json({
      message: 'Group draw saved',
      groups: tournament.groups,
    });
  } catch (error) {
    console.error('Error saving groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
