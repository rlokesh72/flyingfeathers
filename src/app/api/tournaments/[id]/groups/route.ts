import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import { calculateGroupStandings } from '@/lib/championship/standings';

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
