import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Tournament from '@/models/Tournament';
import User from '@/models/User';
import {
  sendPartnerAcceptedEmail,
  sendPartnerDeclinedEmail,
  sendAdminTeamConfirmedEmail,
} from '@/lib/email';

// GET — handle email-based accept/decline link
// URL: /api/player/invite-response?token=xxx&action=accept|decline
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token  = searchParams.get('token');
  const action = searchParams.get('action');

  if (!token || !['accept', 'decline'].includes(action ?? '')) {
    return NextResponse.redirect(`${origin}/player/login?error=invalid_invite`);
  }

  try {
    await connectDB();
    User;

    // Find the registration with this token
    const tournament = await Tournament.findOne({
      'registrations.inviteToken': token,
    });

    if (!tournament) {
      return NextResponse.redirect(`${origin}/player/portal?error=invite_not_found`);
    }

    const reg = (tournament.registrations ?? []).find(
      (r) => r.inviteToken === token
    );

    if (!reg) {
      return NextResponse.redirect(`${origin}/player/portal?error=invite_not_found`);
    }

    // Check token expiry (48 hours)
    if (reg.inviteTokenExpiry && new Date() > reg.inviteTokenExpiry) {
      return NextResponse.redirect(`${origin}/player/portal?error=invite_expired`);
    }

    if (reg.partnerStatus === 'confirmed') {
      return NextResponse.redirect(`${origin}/player/portal?msg=already_confirmed`);
    }

    if (action === 'accept') {
      reg.partnerStatus = 'confirmed';
      reg.players = [reg.player1Name ?? '', reg.player2Name ?? ''];
      reg.inviteToken    = undefined;
      reg.inviteTokenExpiry = undefined;

      tournament.markModified('registrations');
      await tournament.save();

      // Notify player1 their partner accepted
      if (reg.player1Email && reg.player1Name && reg.player2Name) {
        await sendPartnerAcceptedEmail({
          player1Name:  reg.player1Name,
          player1Email: reg.player1Email,
          player2Name:  reg.player2Name,
          teamName:     reg.teamName,
          tournamentName: tournament.name,
        });
      }

      // Notify admin
      await sendAdminTeamConfirmedEmail({
        teamName:       reg.teamName,
        player1Name:    reg.player1Name ?? '',
        player2Name:    reg.player2Name ?? '',
        tournamentName: tournament.name,
      });

      return NextResponse.redirect(`${origin}/player/registrations?msg=partner_accepted`);
    } else {
      // Decline
      const p2Name = reg.player2Name;
      const p1Email = reg.player1Email;
      const p1Name = reg.player1Name;

      reg.player2SupabaseId  = undefined;
      reg.player2Name        = undefined;
      reg.player2Email       = undefined;
      reg.partnerStatus      = 'none';
      reg.inviteToken        = undefined;
      reg.inviteTokenExpiry  = undefined;
      reg.players            = [reg.player1Name ?? ''];

      tournament.markModified('registrations');
      await tournament.save();

      // Notify player1 their invite was declined
      if (p1Email && p1Name && p2Name) {
        await sendPartnerDeclinedEmail({
          player1Name:    p1Name,
          player1Email:   p1Email,
          player2Name:    p2Name,
          teamName:       reg.teamName,
          tournamentName: tournament.name,
        });
      }

      return NextResponse.redirect(`${origin}/player/portal?msg=invite_declined`);
    }
  } catch (error) {
    console.error('invite-response error:', error);
    return NextResponse.redirect(`${origin}/player/portal?error=server_error`);
  }
}
