import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import connectDB from '@/lib/mongodb';
import Player from '@/models/Player';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/player/portal';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          // Query MongoDB directly — no self-referential HTTP fetch
          await connectDB();
          const player = await Player.findOne({ supabaseId: user.id });
          if (!player || !player.onboardingCompleted) {
            return NextResponse.redirect(`${origin}/player/onboarding`);
          }
        } catch {
          // If DB unavailable, send to onboarding — it will handle the redirect
          return NextResponse.redirect(`${origin}/player/onboarding`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/player/login?error=auth_failed`);
}
