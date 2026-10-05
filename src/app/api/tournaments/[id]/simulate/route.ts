import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import { buildSimulationDocument } from '@/lib/championship/simulateTournament';

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

    const source = await Tournament.findById(id);
    if (!source) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    if (source.tournamentFormat !== 'championship-groups') {
      return NextResponse.json({ error: 'Only championship tournaments can be simulated' }, { status: 400 });
    }
    if (source.isSimulation) {
      return NextResponse.json({ error: 'This is already a test tournament' }, { status: 400 });
    }

    const payload = buildSimulationDocument(source, user.userId);
    const tournament = await Tournament.create(payload);
    await tournament.populate('createdBy', 'name email');

    return NextResponse.json({
      message: 'Test tournament created',
      tournament,
      matchesAdded: tournament.matches?.length ?? 0,
    });
  } catch (error) {
    console.error('Error simulating tournament:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
