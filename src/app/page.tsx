'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import ClubHero from '@/app/components/ClubHero';
import ScrollShuttle from '@/app/components/ScrollShuttle';
import ClubOffer from '@/app/components/ClubOffer';
import {
  MapPin,
  GraduationCap,
  Medal,
  Star,
  Feather,
  ArrowRight,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const badges = [
    { Icon: Medal,         label: 'Sports Enthusiast'           },
    { Icon: MapPin,        label: 'Edinburgh Based'             },
    { Icon: GraduationCap, label: 'Empowering Sports in Scotland' },
  ];

  return (
    <main className="relative min-h-screen bg-slate-950 text-white">
      <ScrollShuttle />
      <div className="relative z-10">
      <ClubHero />

      {/* ─── STATS STRIP ────────────────────────────────────────────── */}
      <section className="border-y border-white/5 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center max-w-2xl mx-auto">
            {[
              { value: '50+',  label: 'Active Members' },
              { value: '50+',  label: 'Tournaments Hosted' },
              { value: '2018', label: 'Founded' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-semibold text-teal-100 mb-1">
                  {stat.value}
                </p>
                <p className="text-[11px] text-slate-400 uppercase tracking-[0.22em]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ORGANISER ──────────────────────────────────────────────── */}
      <section className="py-28 container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.38em] text-teal-200/90 font-medium mb-3 text-center">Meet the Organiser</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-center mb-16">The Person Behind the Club</h2>

          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Photo */}
            <div className="shrink-0">
              <div className="relative w-64 h-64 md:w-72 md:h-72">
                <div className="absolute inset-0 rounded-full border border-teal-200/35 p-[3px]">
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
                <div className="absolute -bottom-3 -right-3 flex items-center gap-1.5 border border-teal-200/40 bg-slate-950 px-4 py-2">
                  <Star className="w-3.5 h-3.5 text-teal-200" />
                  <span className="text-[10px] uppercase tracking-[0.22em] text-teal-100">Head Organiser</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-3xl font-bold text-white mb-1">Sammy</h3>
              <p className="text-teal-200/90 font-medium mb-6">Founder &amp; Tournament Director</p>

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
                    <Icon className="w-3.5 h-3.5 text-teal-200/80 shrink-0" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ClubOffer />

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <section className="py-28 container mx-auto px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 border border-teal-200/30 mb-8">
            <Feather className="w-6 h-6 text-teal-200" strokeWidth={1.5} />
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">Ready to play?</h2>
          <p className="text-slate-400 text-lg mb-10">
            Browse upcoming tournaments and current standings — no login needed.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/schedules')}
              className="bg-transparent border border-teal-200/70 text-teal-100 hover:bg-teal-200 hover:text-slate-950 px-10 py-6 text-[11px] uppercase tracking-[0.28em] shadow-none"
            >
              See All Tournaments
              <ArrowRight className="ml-2 w-4 h-4" />
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
      </div>
    </main>
  );
}
