import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import { generateAllReadyMensStages, inspectMensNextStages } from '@/lib/championship/mensFormat';

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
    if (!['knockouts_active', 'knockouts_generated'].includes(tournament.championshipStatus ?? '')) {
      return NextResponse.json({ error: 'Championships must already be generated' }, { status: 400 });
    }

    const current = (tournament.bracketMatches ?? []).map((bm: any) => (bm.toObject ? bm.toObject() : bm));
    const ready = inspectMensNextStages(current);
    if (ready.length === 0) {
      return NextResponse.json({ error: 'No men’s stage is ready to generate yet' }, { status: 400 });
    }

    const numCourts = tournament.numberOfCourts ?? 1;
    const maxSlot = tournament.matches.reduce((max: number, m: any) => Math.max(max, m.timeSlot ?? 0), 0);
    const generated = generateAllReadyMensStages(
      current,
      tournament.teams,
      tournament.matches.length,
      numCourts,
      maxSlot + 1
    );

    if (!generated.bracketMatches.length) {
      return NextResponse.json({ error: 'No matches were created' }, { status: 400 });
    }

    tournament.bracketMatches = [...current, ...generated.bracketMatches] as any;
    tournament.matches.push(...(generated.globalMatches as any[]));
    await tournament.save();

    return NextResponse.json({
      message: 'Next men’s championship stage created',
      actions: generated.actions,
      matchesAdded: generated.globalMatches.length,
    });
  } catch (error) {
    console.error('Error generating next championship stage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
