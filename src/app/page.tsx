'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Trophy,
  CalendarDays,
  Activity,
  Users,
  TrendingUp,
  Smartphone,
  MapPin,
  GraduationCap,
  Medal,
  Star,
  Feather,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const features = [
    {
      Icon: Trophy,
      title: 'Tournament Management',
      desc: 'Create, manage, and run complete tournaments — brackets, schedules, results all in one place.',
      accent: 'cyan' as const,
    },
    {
      Icon: CalendarDays,
      title: 'Court Scheduling',
      desc: 'Smart court allocation that optimises playing time and minimises wait periods across all sessions.',
      accent: 'pink' as const,
    },
    {
      Icon: Activity,
      title: 'Live Scoring',
      desc: 'Real-time match scoring with live leaderboards and automatic standings updates.',
      accent: 'cyan' as const,
    },
    {
      Icon: Users,
      title: 'Player Registration',
      desc: 'Streamlined sign-up with player profiles and skill tracking for every member.',
      accent: 'pink' as const,
    },
    {
      Icon: TrendingUp,
      title: 'Rankings & Stats',
      desc: 'Comprehensive player statistics and rankings that reflect real competitive performance.',
      accent: 'cyan' as const,
    },
    {
      Icon: Smartphone,
      title: 'Mobile Friendly',
      desc: 'Fully responsive — check scores, schedules and standings on any device, anywhere.',
      accent: 'pink' as const,
    },
  ];

  const badges = [
    { Icon: Medal,         label: 'Sports Enthusiast'           },
    { Icon: MapPin,        label: 'Edinburgh Based'             },
    { Icon: GraduationCap, label: 'Empowering Indian Communities Through Sport' },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* ─── HERO ───────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1920&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/60 to-slate-950" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center pt-24 pb-32">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-36 h-36 rounded-2xl bg-white/5 backdrop-blur border border-white/10 mb-6 shadow-xl">
              <img
                src="/flying-feathers-logo.png"
                alt="Flying Feathers Logo"
                className="w-28 h-28 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </div>

          <span className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold mb-4">
            Edinburgh&apos;s Premier Badminton Club
          </span>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight mb-6 leading-none">
            <span className="text-white">Flying</span>{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">Feathers</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed">
            Competitive badminton at its finest — organised tournaments, vibrant community,
            and players of every skill level welcome in the heart of Edinburgh.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/schedules')}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white border-0 px-8 py-6 text-base font-semibold shadow-lg shadow-cyan-500/25 transition-all duration-300"
            >
              View Tournaments
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/club-info')}
              className="border-2 border-pink-400 text-pink-300 hover:bg-pink-500 hover:text-white hover:border-pink-500 px-8 py-6 text-base font-semibold transition-all duration-300"
            >
              About the Club
            </Button>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500 animate-bounce">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-cyan-600/10 via-slate-900 to-pink-600/10 border-y border-white/5 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center max-w-2xl mx-auto">
            {[
              { value: '50+',  label: 'Active Members' },
              { value: '50+',  label: 'Tournaments Hosted' },
              { value: '2018', label: 'Founded' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ORGANISER ──────────────────────────────────────────────── */}
      <section className="py-28 container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-semibold mb-3 text-center">Meet the Organiser</p>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">The Person Behind the Club</h2>

          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Photo */}
            <div className="shrink-0">
              <div className="relative w-64 h-64 md:w-72 md:h-72">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 to-pink-500 p-[3px]">
                  <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden">
                    <img
                      src="/organiser.jpg"
                      alt="Club Organiser"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = 'none';
                        const parent = el.parentElement!;
                        parent.innerHTML = `
                          <div class="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                            <svg class="w-24 h-24 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                            </svg>
                            <p class="text-slate-500 text-xs mt-2 text-center">Add organiser.jpg<br/>to /public</p>
                          </div>`;
                      }}
                    />
                  </div>
                </div>
                {/* Badge */}
                <div className="absolute -bottom-3 -right-3 flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full px-4 py-2 shadow-lg shadow-cyan-500/30">
                  <Star className="w-3.5 h-3.5 text-white fill-white" />
                  <span className="text-xs font-bold text-white">Head Organiser</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-3xl font-bold text-white mb-1">Sammy</h3>
              <p className="text-cyan-400 font-semibold mb-6">Founder &amp; Tournament Director</p>

              <p className="text-slate-300 leading-relaxed mb-4">
                {/* ✏️ Replace with real bio */}
                A passionate badminton player with over 15 years of competitive experience, Sammy founded
                Flying Feathers with a vision to build a thriving badminton community right here in Edinburgh.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                From grassroots club nights to large-scale city tournaments, every event is meticulously
                organised to give players the best competitive experience possible — regardless of skill level.
              </p>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {badges.map(({ Icon, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-slate-300"
                  >
                    <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-900/60">
        <div className="container mx-auto px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-pink-400 font-semibold mb-3 text-center">What We Offer</p>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Everything You Need to Compete</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map(({ Icon, title, desc, accent }) => (
              <div
                key={title}
                className={`group bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1
                  ${accent === 'cyan'
                    ? 'hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10'
                    : 'hover:border-pink-500/40 hover:shadow-xl hover:shadow-pink-500/10'}`}
              >
                <div
                  className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-5
                    ${accent === 'cyan' ? 'bg-cyan-500/10' : 'bg-pink-500/10'}`}
                >
                  <Icon
                    className={`w-5 h-5 ${accent === 'cyan' ? 'text-cyan-400' : 'text-pink-400'}`}
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className={`text-base font-semibold mb-2 ${accent === 'cyan' ? 'text-cyan-300' : 'text-pink-300'}`}>
                  {title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <section className="py-28 container mx-auto px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-pink-500/15 border border-white/10 mb-8">
            <Feather className="w-6 h-6 text-cyan-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to play?</h2>
          <p className="text-slate-400 text-lg mb-10">
            Browse upcoming tournaments and current standings — no login needed.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/schedules')}
              className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white border-0 px-10 py-6 text-base font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-300 group"
            >
              See All Tournaments
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => router.push('/login')}
              className="text-slate-400 hover:text-white hover:bg-white/5 px-8 py-6 text-base"
            >
              Admin Login
            </Button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <Feather className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
            <span className="font-semibold text-slate-400">Flying Feathers Badminton Club</span>
            <span className="text-slate-600">· Edinburgh</span>
          </div>
          <span>© {new Date().getFullYear()} All rights reserved</span>
        </div>
      </footer>

    </main>
  );
}
