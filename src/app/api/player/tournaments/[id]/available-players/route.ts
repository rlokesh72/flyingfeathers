import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import Player from '@/models/Player';
import User from '@/models/User';

// GET — list players who can be invited as partner for this tournament
// Returns registered players (Player profiles) who are NOT already partnered in this tournament
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    User;

    const tournament = await Tournament.findById(id).select('registrations maxTeams championshipStatus');
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    // Collect supabase IDs already committed (confirmed partner or player1 with confirmed partner)
    const regs = tournament.registrations ?? [];
    const committedIds = new Set<string>();
    regs.forEach((r) => {
      if (r.partnerStatus === 'confirmed') {
        if (r.player1SupabaseId) committedIds.add(r.player1SupabaseId);
        if (r.player2SupabaseId) committedIds.add(r.player2SupabaseId);
      }
    });

    // All players with a profile, excluding current user and committed players
    const allPlayers = await Player.find({ onboardingCompleted: true }).select('supabaseId name email skillLevel');
    const available = allPlayers.filter(
      (p) => p.supabaseId !== user.id && !committedIds.has(p.supabaseId)
    );

    return NextResponse.json({ players: available });
  } catch (error) {
    console.error('GET available-players error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
