import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import {
  sendPartnerAcceptedEmail,
  sendPartnerDeclinedEmail,
  sendAdminTeamConfirmedEmail,
} from '@/lib/email';

// POST — partner accepts or declines the invite
// Body: { action: 'accept' | 'decline' }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string; regId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tournamentId, regId } = await params;
    const { action } = await request.json();

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'action must be accept or decline' }, { status: 400 });
    }

    await connectDB();
    User;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    const reg = (tournament.registrations ?? []).find((r) => r._id.toString() === regId);
    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    // Only the invited partner can respond
    if (reg.player2SupabaseId !== user.id) {
      return NextResponse.json({ error: 'You are not the invited partner for this registration' }, { status: 403 });
    }
    if (reg.partnerStatus !== 'requested') {
      return NextResponse.json({ error: 'No pending partner request on this registration' }, { status: 400 });
    }

    if (action === 'accept') {
      reg.partnerStatus       = 'confirmed';
      reg.players             = [reg.player1Name ?? '', reg.player2Name ?? ''];
      reg.inviteToken         = undefined;
      reg.inviteTokenExpiry   = undefined;

      tournament.markModified('registrations');
      await tournament.save();

      // Notify player1 (fire-and-forget)
      if (reg.player1Email && reg.player1Name && reg.player2Name) {
        sendPartnerAcceptedEmail({
          player1Name:    reg.player1Name,
          player1Email:   reg.player1Email,
          player2Name:    reg.player2Name,
          teamName:       reg.teamName,
          tournamentName: tournament.name,
        }).catch(() => {});
      }
      // Notify admin
      sendAdminTeamConfirmedEmail({
        teamName:       reg.teamName,
        player1Name:    reg.player1Name ?? '',
        player2Name:    reg.player2Name ?? '',
        tournamentName: tournament.name,
      }).catch(() => {});
    } else {
      const p2Name  = reg.player2Name;
      const p1Email = reg.player1Email;
      const p1Name  = reg.player1Name;

      reg.player2SupabaseId  = undefined;
      reg.player2Name        = undefined;
      reg.player2Email       = undefined;
      reg.partnerStatus      = 'none';
      reg.inviteToken        = undefined;
      reg.inviteTokenExpiry  = undefined;
      reg.players            = [reg.player1Name ?? ''];

      tournament.markModified('registrations');
      await tournament.save();

      // Notify player1 (fire-and-forget)
      if (p1Email && p1Name && p2Name) {
        sendPartnerDeclinedEmail({
          player1Name:    p1Name,
          player1Email:   p1Email,
          player2Name:    p2Name,
          teamName:       reg.teamName,
          tournamentName: tournament.name,
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      message: action === 'accept' ? 'Partnership confirmed! Your team is registered.' : 'Partner request declined.',
      registration: reg,
    });
  } catch (error) {
    console.error('POST respond partner error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
