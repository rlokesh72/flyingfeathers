import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import Player from '@/models/Player';
import User from '@/models/User';
import { sendPartnerInviteEmail } from '@/lib/email';
import crypto from 'crypto';

// POST — player1 invites another player as their partner
// Body: { partnerSupabaseId: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string; regId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tournamentId, regId } = await params;
    const { partnerSupabaseId } = await request.json();

    if (!partnerSupabaseId) {
      return NextResponse.json({ error: 'partnerSupabaseId is required' }, { status: 400 });
    }

    await connectDB();
    User;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    const reg = (tournament.registrations ?? []).find((r) => r._id.toString() === regId);
    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    // Only player1 can invite a partner
    if (reg.player1SupabaseId !== user.id) {
      return NextResponse.json({ error: 'Only the team creator can invite a partner' }, { status: 403 });
    }
    if (reg.partnerStatus === 'confirmed') {
      return NextResponse.json({ error: 'Team already has a confirmed partner' }, { status: 400 });
    }

    // Make sure the partner isn't already in another confirmed team for this tournament
    const alreadyCommitted = (tournament.registrations ?? []).some(
      (r) => r._id.toString() !== regId &&
        r.partnerStatus === 'confirmed' &&
        (r.player1SupabaseId === partnerSupabaseId || r.player2SupabaseId === partnerSupabaseId)
    );
    if (alreadyCommitted) {
      return NextResponse.json({ error: 'This player is already in a confirmed team' }, { status: 409 });
    }

    // Look up partner profile for their name and email
    const partnerProfile = await Player.findOne({ supabaseId: partnerSupabaseId });
    const partnerName  = partnerProfile?.name ?? 'Unknown Player';
    const partnerEmail = partnerProfile?.email ?? '';

    // Generate one-time invite token (48hr expiry)
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    reg.player2SupabaseId   = partnerSupabaseId;
    reg.player2Name         = partnerName;
    reg.player2Email        = partnerEmail;
    reg.partnerStatus       = 'requested';
    reg.inviteToken         = inviteToken;
    reg.inviteTokenExpiry   = inviteTokenExpiry;
    reg.players             = [reg.player1Name ?? '', partnerName];

    tournament.markModified('registrations');
    await tournament.save();

    // Send invite email (fire-and-forget)
    if (partnerEmail) {
      sendPartnerInviteEmail({
        inviterName:    reg.player1Name ?? 'Your teammate',
        partnerName,
        partnerEmail,
        teamName:       reg.teamName,
        tournamentName: tournament.name,
        tournamentId,
        registrationId: regId,
        inviteToken,
      }).catch(() => {});
    }

    return NextResponse.json({ message: `Partner request sent to ${partnerName}`, registration: reg });
  } catch (error) {
    console.error('POST invite partner error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
