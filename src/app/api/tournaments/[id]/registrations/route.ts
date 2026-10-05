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

    const body = await request.json();
    const adminUser = verifyToken(request);

    if (body.adminCreate) {
      if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!['registration_open', 'registration_closed'].includes(tournament.championshipStatus ?? '')) {
        return NextResponse.json({ error: 'Teams can only be added before groups are confirmed' }, { status: 400 });
      }

      const player1Name = String(body.player1Name || '').trim();
      const player2Name = String(body.player2Name || '').trim();
      if (!player1Name) {
        return NextResponse.json({ error: 'Player 1 name is required' }, { status: 400 });
      }

      const players = [player1Name, player2Name].filter(Boolean);
      const acceptNow = body.accept !== false;
      const acceptedCount = (tournament.registrations ?? []).filter((r: any) => r.status === 'accepted').length;
      if (acceptNow && tournament.maxTeams && acceptedCount >= tournament.maxTeams) {
        return NextResponse.json({ error: `Cannot accept more than ${tournament.maxTeams} teams` }, { status: 400 });
      }

      const nextNumber = (tournament.registrations?.length ?? 0) + 1;
      const teamName = String(body.teamName || '').trim() || `Team ${nextNumber}`;
      const player1Email = String(body.player1Email || '').trim();
      const player2Email = String(body.player2Email || '').trim();
      const category = body.category === 'women' || body.category === 'men' ? body.category : undefined;

      const registration = {
        teamName,
        players,
        contactEmail: player1Email || player2Email || 'admin@flyingfeathers.co.uk',
        status: acceptNow ? 'accepted' : 'pending',
        appliedAt: new Date(),
        reviewedAt: acceptNow ? new Date() : undefined,
        player1Name,
        player1Email: player1Email || undefined,
        player2Name: player2Name || undefined,
        player2Email: player2Email || undefined,
        partnerStatus: player2Name ? 'confirmed' : 'none',
        category,
        notes: 'Added by admin',
      };

      if (!tournament.registrations) tournament.registrations = [];
      tournament.registrations.push(registration as any);
      if (acceptNow) {
        tournament.numberOfTeams = (tournament.registrations ?? []).filter((r: any) => r.status === 'accepted').length;
      }
      await tournament.save();

      const newReg = tournament.registrations[tournament.registrations.length - 1];
      return NextResponse.json({ message: acceptNow ? 'Team added and accepted' : 'Team added', registration: newReg }, { status: 201 });
    }

    if (tournament.championshipStatus !== 'registration_open') {
      return NextResponse.json({ error: 'Registrations are not currently open' }, { status: 400 });
    }

    const { teamName, players, contactEmail, contactPhone } = body;

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
