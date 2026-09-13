import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';

// GET — current player's registrations across all tournaments + incoming partner requests
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    User;

    // Find all championship-groups tournaments that have this player in a registration
    const tournaments = await Tournament.find({
      tournamentFormat: 'championship-groups',
      $or: [
        { 'registrations.player1SupabaseId': user.id },
        { 'registrations.player2SupabaseId': user.id },
      ],
    }).select('name scheduledDate championshipStatus registrations');

    const myRegistrations: any[] = [];
    const partnerRequests: any[] = [];

    tournaments.forEach((t) => {
      (t.registrations ?? []).forEach((reg) => {
        const isPlayer1 = reg.player1SupabaseId === user.id;
        const isPlayer2 = reg.player2SupabaseId === user.id;

        if (isPlayer1) {
          myRegistrations.push({
            tournamentId: t._id,
            tournamentName: t.name,
            scheduledDate: t.scheduledDate,
            championshipStatus: t.championshipStatus,
            registrationId: reg._id,
            teamName: reg.teamName,
            player1Name: reg.player1Name,
            player2Name: reg.player2Name,
            partnerStatus: reg.partnerStatus,
            status: reg.status,
            appliedAt: reg.appliedAt,
          });
        } else if (isPlayer2 && reg.partnerStatus === 'requested') {
          // Incoming partner request for this player
          partnerRequests.push({
            tournamentId: t._id,
            tournamentName: t.name,
            scheduledDate: t.scheduledDate,
            registrationId: reg._id,
            teamName: reg.teamName,
            requestedByName: reg.player1Name,
            appliedAt: reg.appliedAt,
          });
        } else if (isPlayer2 && reg.partnerStatus === 'confirmed') {
          // Also show confirmed partnership where they're player2
          myRegistrations.push({
            tournamentId: t._id,
            tournamentName: t.name,
            scheduledDate: t.scheduledDate,
            championshipStatus: t.championshipStatus,
            registrationId: reg._id,
            teamName: reg.teamName,
            player1Name: reg.player1Name,
            player2Name: reg.player2Name,
            partnerStatus: reg.partnerStatus,
            status: reg.status,
            appliedAt: reg.appliedAt,
            role: 'partner',
          });
        }
      });
    });

    return NextResponse.json({ myRegistrations, partnerRequests });
  } catch (error) {
    console.error('GET /api/player/registrations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
