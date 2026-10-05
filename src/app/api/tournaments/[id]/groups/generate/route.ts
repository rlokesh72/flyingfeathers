import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import { generateGroupMatches } from '@/lib/championship/generateGroups';
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

function groupLabel(index: number) {
  return index < 26
    ? `Group ${String.fromCharCode(65 + index)}`
    : `Group ${index + 1}`;
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
        { error: 'Registration must be closed before confirming groups' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const incoming = Array.isArray(body.groups) && body.groups.length
      ? body.groups
      : (tournament.groups ?? []);

    if (!incoming.length) {
      return NextResponse.json(
        { error: 'Arrange teams into groups first' },
        { status: 400 }
      );
    }

    const teamCount = tournament.teams.length;
    const seen = new Set<number>();
    const groups = incoming.map((g: any, i: number) => {
      const teamIndices = (g.teamIndices ?? [])
        .map((n: any) => Number(n))
        .filter((n: number) => Number.isInteger(n) && n >= 0 && n < teamCount);
      const name = String(g.name || groupLabel(i)).trim() || groupLabel(i);
      return {
        name,
        sequence: i,
        teamIndices,
        category: normalizeGroupCategory(g.category, name),
      };
    });

    for (const group of groups) {
      if (group.teamIndices.length < 2) {
        return NextResponse.json(
          { error: `${group.name} needs at least 2 teams` },
          { status: 400 }
        );
      }
      for (const idx of group.teamIndices) {
        if (seen.has(idx)) {
          return NextResponse.json(
            { error: `${tournament.teams[idx]?.name ?? 'A team'} is in more than one group` },
            { status: 400 }
          );
        }
        seen.add(idx);
      }
    }

    if (seen.size !== teamCount) {
      return NextResponse.json(
        { error: `Assign every team to a group. ${teamCount - seen.size} still unassigned.` },
        { status: 400 }
      );
    }

    const numCourts: number = tournament.numberOfCourts ?? 1;
    const groupMatches = generateGroupMatches(groups, numCourts, 1);

    tournament.groups = groups as any;
    tournament.numberOfGroups = groups.length;
    tournament.matches = groupMatches as any[];
    tournament.status = 'in-progress';
    tournament.championshipStatus = 'group_stage_active';

    await tournament.save();

    return NextResponse.json({
      message: 'Groups confirmed and matches created',
      groups: tournament.groups,
      matchesAdded: groupMatches.length,
      championshipStatus: tournament.championshipStatus,
    });
  } catch (error) {
    console.error('Error generating groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
