import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import Player from '@/models/Player';
import User from '@/models/User';
import { sendTournamentRegistrationEmail } from '@/lib/email';

// POST — authenticated player registers a team for a tournament
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    User;

    const tournament = await Tournament.findById(id);
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    if (tournament.tournamentFormat !== 'championship-groups') {
      return NextResponse.json({ error: 'Player registration is only for Championship Groups tournaments' }, { status: 400 });
    }
    if (tournament.championshipStatus !== 'registration_open') {
      return NextResponse.json({ error: 'Registration is not currently open for this tournament' }, { status: 400 });
    }

    const regs = tournament.registrations ?? [];

    // Check player hasn't already registered
    const alreadyRegistered = regs.some(
      (r) => r.player1SupabaseId === user.id || r.player2SupabaseId === user.id
    );
    if (alreadyRegistered) {
      return NextResponse.json({ error: 'You are already registered for this tournament' }, { status: 409 });
    }

    // Check capacity
    const acceptedCount = regs.filter((r) => r.status === 'accepted').length;
    if (acceptedCount >= (tournament.maxTeams ?? 32)) {
      return NextResponse.json({ error: 'Tournament is full' }, { status: 400 });
    }

    // Get player profile for name / email
    const playerProfile = await Player.findOne({ supabaseId: user.id });
    const player1Name = playerProfile?.name ?? user.user_metadata?.full_name ?? user.email ?? 'Unknown';
    const contactEmail = playerProfile?.email ?? user.email ?? '';

    const registration = {
      teamName: `Team ${(tournament.registrations?.length ?? 0) + 1}`,
      players: [player1Name],
      contactEmail,
      status: 'pending' as const,
      appliedAt: new Date(),
      player1SupabaseId: user.id,
      player1Name,
      player1Email: contactEmail,
      partnerStatus: 'none' as const,
    };

    if (!tournament.registrations) tournament.registrations = [];
    tournament.registrations.push(registration as any);
    await tournament.save();

    const newReg = tournament.registrations[tournament.registrations.length - 1];

    // Send confirmation email (fire-and-forget)
    sendTournamentRegistrationEmail({
      playerName: player1Name,
      email: contactEmail,
      tournamentName: tournament.name,
      teamName: registration.teamName,
      scheduledDate: tournament.scheduledDate.toISOString(),
    }).catch(() => {});

    return NextResponse.json({
      message: 'Registered successfully! Now find a partner to complete your team.',
      registration: newReg,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/player/tournaments/[id]/register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
