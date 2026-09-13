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

// GET — list registrations (auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    User; // ensure model registered

    const tournament = await Tournament.findById(id);
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    if (tournament.tournamentFormat !== 'championship-groups') {
      return NextResponse.json({ error: 'Registrations only apply to championship-groups tournaments' }, { status: 400 });
    }

    return NextResponse.json({ registrations: tournament.registrations ?? [] });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — submit a registration (public — player applies)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    User;

    const tournament = await Tournament.findById(id);
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    if (tournament.tournamentFormat !== 'championship-groups') {
      return NextResponse.json({ error: 'Registrations only apply to championship-groups tournaments' }, { status: 400 });
    }
    if (tournament.championshipStatus !== 'registration_open') {
      return NextResponse.json({ error: 'Registrations are not currently open' }, { status: 400 });
    }

    const { teamName, players, contactEmail, contactPhone } = await request.json();

    if (!teamName || !players || !contactEmail) {
      return NextResponse.json({ error: 'teamName, players, and contactEmail are required' }, { status: 400 });
    }

    if (!Array.isArray(players) || players.length < 1) {
      return NextResponse.json({ error: 'At least 1 player name required' }, { status: 400 });
    }

    const registration = {
      teamName: String(teamName).trim(),
      players: players.map((p: string) => String(p).trim()),
      contactEmail: String(contactEmail).trim(),
      contactPhone: contactPhone ? String(contactPhone).trim() : undefined,
      status: 'pending' as const,
      appliedAt: new Date(),
    };

    if (!tournament.registrations) tournament.registrations = [];
    tournament.registrations.push(registration as any);
    await tournament.save();

    const newReg = tournament.registrations[tournament.registrations.length - 1];
    return NextResponse.json({ message: 'Registration submitted successfully', registration: newReg }, { status: 201 });
  } catch (error) {
    console.error('Error submitting registration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
