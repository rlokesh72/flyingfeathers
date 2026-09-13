import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Player from '@/models/Player';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code     = searchParams.get('code');
  // ?redirect= is forwarded from the login page via the OAuth redirectTo URL
  const redirect = searchParams.get('redirect') ?? '';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          await connectDB();
          const player = await Player.findOne({ supabaseId: user.id });
          if (!player || !player.onboardingCompleted) {
            // Not onboarded yet — send to onboarding, preserving the intended redirect
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

      // Onboarding complete — go to the intended destination or portal
      const dest = redirect || '/player/portal';
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/player/login?error=auth_failed`);
}
