import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Player from '@/models/Player';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code       = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type       = searchParams.get('type') as 'email' | 'recovery' | 'invite' | null;
  // ?redirect= is forwarded from the login page / signUp emailRedirectTo
  const redirect   = searchParams.get('redirect') ?? '';

  const supabase = await createClient();
  let authError: any = null;

  if (code) {
    // ── OAuth / magic-link PKCE code exchange ──────────────────────
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else if (token_hash && type) {
    // ── Email confirmation / OTP token ─────────────────────────────
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    authError = error;
  } else {
    // Nothing to exchange
    return NextResponse.redirect(`${origin}/player/login?error=auth_failed`);
  }

  if (authError) {
    console.error('Auth callback error:', authError.message);
    return NextResponse.redirect(`${origin}/player/login?error=auth_failed`);
  }

  // ── Session established — route based on onboarding status ───────
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
      await connectDB();
      const player = await Player.findOne({ supabaseId: user.id });
      if (!player || !player.onboardingCompleted) {
        const dest = redirect
          ? `/player/onboarding?redirect=${encodeURIComponent(redirect)}`
          : '/player/onboarding';
        return NextResponse.redirect(`${origin}${dest}`);
      }
    } catch {
      const dest = redirect
        ? `/player/onboarding?redirect=${encodeURIComponent(redirect)}`
        : '/player/onboarding';
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  // Onboarding complete — go to intended destination or portal
  return NextResponse.redirect(`${origin}${redirect || '/player/portal'}`);
}
