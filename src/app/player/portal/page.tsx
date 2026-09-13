'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Feather, Trophy, CalendarDays, TrendingUp,
  Users, Settings, LogOut, ChevronRight,
  Activity, Clock
} from 'lucide-react';

interface PlayerProfile {
  name: string;
  email: string;
  skillLevel?: string;
  yearsOfExperience?: number;
  preferredHand?: string;
  avatarUrl?: string;
  onboardingCompleted: boolean;
}

const SKILL_COLOURS: Record<string, string> = {
  beginner:     'text-green-400 bg-green-400/10 border-green-400/20',
  intermediate: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  advanced:     'text-purple-400 bg-purple-400/10 border-purple-400/20',
  competitive:  'text-pink-400 bg-pink-400/10 border-pink-400/20',
};

const FEATURES = [
  { Icon: Trophy,       label: 'My Registrations',  desc: 'View your tournament registrations and partner requests', href: '/player/registrations', live: true  },
  { Icon: CalendarDays, label: 'Browse Tournaments', desc: 'Find open tournaments and register your team',           href: '/player/tournaments',   live: true  },
  { Icon: TrendingUp,   label: 'My Stats',           desc: 'Match history, wins and rankings',                       href: null,                    live: false },
  { Icon: Users,        label: 'Find Players',       desc: 'Connect with other club members',                        href: null,                    live: false },
  { Icon: Activity,     label: 'Live Scores',        desc: 'Follow ongoing matches in real-time',                    href: null,                    live: false },
  { Icon: Clock,        label: 'Match History',      desc: 'Review all your past matches',                           href: null,                    live: false },
];

export default function PlayerPortalPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/player/login'); return; }

      const res = await fetch(`/api/player/profile?supabaseId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (!data?.onboardingCompleted) { router.push('/player/onboarding'); return; }
        setProfile(data);
      } else {
        router.push('/player/onboarding');
      }
      setLoading(false);
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/player/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const skillColour = SKILL_COLOURS[profile?.skillLevel ?? ''] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background accent */}
      <div className="fixed top-0 right-0 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ─── Nav ────────────────────────────────────────── */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Feather className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
            <span className="font-bold text-white text-sm">Flying Feathers</span>
            <span className="text-slate-600 text-sm">/ Player Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/schedules')}
              className="text-slate-400 hover:text-white text-sm transition"
            >
              View Tournaments
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-5xl">

        {/* ─── Hero / Profile card ────────────────────── */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800/60 border border-white/8 rounded-2xl p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white shrink-0 shadow-lg shadow-cyan-500/20">
            {profile?.name?.[0]?.toUpperCase() ?? '?'}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">{profile?.name}</h1>
              {profile?.skillLevel && (
                <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${skillColour}`}>
                  {profile.skillLevel}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-3">{profile?.email}</p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              {profile?.yearsOfExperience !== undefined && (
                <span>{profile.yearsOfExperience} yr{profile.yearsOfExperience !== 1 ? 's' : ''} experience</span>
              )}
              {profile?.preferredHand && (
                <span>{profile.preferredHand.charAt(0).toUpperCase() + profile.preferredHand.slice(1)}-handed</span>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push('/player/onboarding')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm border border-white/8 hover:border-white/20 px-4 py-2 rounded-xl transition shrink-0"
          >
            <Settings className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>

        {/* ─── Features grid ──────────────────────────── */}
        <h2 className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-5">Your Features</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ Icon, label, desc, href, live }) => (
            <div
              key={label}
              onClick={() => href && router.push(href)}
              className={`group bg-slate-900/60 border border-white/6 rounded-2xl p-5 transition-all duration-300
                ${href ? 'hover:border-cyan-500/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/8 cursor-pointer' : 'cursor-default opacity-60'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border
                  ${live ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-slate-800/60 border-white/5'}`}>
                  <Icon className={`w-4.5 h-4.5 ${live ? 'text-cyan-400' : 'text-slate-600'}`} strokeWidth={1.75} style={{ width: '1.1rem', height: '1.1rem' }} />
                </div>
                <span className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border
                  ${live ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-slate-600 bg-slate-800/60 border-white/5'}`}>
                  {live ? 'Live' : 'Soon'}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* ─── Browse public schedules CTA ────────────── */}
        <div className="mt-8 bg-gradient-to-r from-cyan-500/8 to-pink-500/8 border border-white/6 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white mb-1">Browse Upcoming Tournaments</h3>
            <p className="text-slate-400 text-sm">Check confirmed tournaments and current standings — open to all.</p>
          </div>
          <button
            onClick={() => router.push('/schedules')}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition shrink-0"
          >
            View Schedules <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
