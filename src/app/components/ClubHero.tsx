'use client';

import { useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(useGSAP);

function ShuttleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <path
        d="M24 6c2.2 3.4 3.6 7.2 3.6 10.8 0 4.8-2.2 8.4-3.6 10.6-1.4-2.2-3.6-5.8-3.6-10.6C20.4 13.2 21.8 9.4 24 6Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M20.8 16.2 24 27.4l3.2-11.2" stroke="currentColor" strokeWidth="1.1" />
      <path d="M18.6 28.8h10.8l-5.4 12.6L18.6 28.8Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M19.8 31.4h8.4M20.8 34.2h6.4" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function CourtLines() {
  return (
    <svg
      className="hero-court absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g fill="none" stroke="rgba(153,221,210,0.16)" strokeWidth="1">
        <rect className="hero-line" x="80" y="70" width="1040" height="660" />
        <line className="hero-line" x1="80" y1="400" x2="1120" y2="400" />
        <line className="hero-line" x1="600" y1="70" x2="600" y2="730" />
        <rect className="hero-line" x="80" y="190" width="1040" height="420" />
        <line className="hero-line" x1="280" y1="190" x2="280" y2="610" />
        <line className="hero-line" x1="920" y1="190" x2="920" y2="610" />
      </g>
    </svg>
  );
}

const spring = { type: 'spring' as const, bounce: 0.15, visualDuration: 0.26 };

function ClubLink({
  children,
  onClick,
  tone,
}: {
  children: ReactNode;
  onClick: () => void;
  tone: 'accent' | 'line' | 'ghost';
}) {
  const styles = {
    accent: 'border-teal-200/70 text-teal-100 hover:bg-teal-200 hover:text-slate-950',
    line: 'border-white/25 text-slate-100 hover:border-teal-200/50 hover:text-teal-100',
    ghost: 'border-transparent text-slate-400 hover:text-teal-100 hover:border-teal-200/30',
  }[tone];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`hero-cta relative px-6 py-2.5 text-[11px] uppercase tracking-[0.28em] border bg-transparent transition-colors duration-200 ${styles}`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
    >
      {children}
    </motion.button>
  );
}

export default function ClubHero() {
  const router = useRouter();
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.hero-photo', { scale: 1.06, duration: 1.8, ease: 'power2.out' }, 0)
      .from('.hero-line', { autoAlpha: 0, duration: 0.8, stagger: 0.05 }, 0.05)
      .from('.hero-crest', { autoAlpha: 0, y: 16, duration: 0.55 }, 0.08)
      .from('.hero-kicker', { autoAlpha: 0, y: 14, duration: 0.45 }, 0.18)
      .from('.hero-title-word', { autoAlpha: 0, y: 18, duration: 0.5, stagger: 0.08 }, 0.26)
      .from('.hero-rule', { autoAlpha: 0, y: 10, duration: 0.35 }, 0.42)
      .from('.hero-copy', { autoAlpha: 0, y: 14, duration: 0.45 }, 0.5)
      .from('.hero-cta', { autoAlpha: 0, y: 12, duration: 0.4, stagger: 0.08 }, 0.58)
      .from('.hero-meta', { autoAlpha: 0, y: 10, duration: 0.35 }, 0.88);

    gsap.to('.hero-shuttle-a', {
      y: -14,
      rotation: 8,
      duration: 4.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    gsap.to('.hero-shuttle-b', {
      y: 12,
      rotation: -10,
      duration: 5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 0.6,
    });
  }, { scope: root });

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={root}
        className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-slate-950"
      >
        <div
          className="hero-photo absolute inset-0 bg-cover bg-center will-change-transform"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1920&q=80')" }}
        />
        <div className="absolute inset-0 bg-slate-950/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/35 to-slate-950/90" />
        <CourtLines />

        <ShuttleMark className="hero-shuttle hero-shuttle-a absolute top-[18%] left-[8%] w-10 h-10 text-teal-200/25" />
        <ShuttleMark className="hero-shuttle hero-shuttle-b absolute bottom-[22%] right-[10%] w-12 h-12 text-teal-100/20" />

        <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center pt-24 pb-28">
          <motion.div
            className="hero-intro hero-crest mb-8"
            whileHover={{ scale: 1.03 }}
            transition={spring}
          >
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-[-10px] rounded-[1.6rem] border border-teal-200/25" />
              <div className="absolute inset-[-18px] rounded-[2rem] border border-teal-200/10" />
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
                <img
                  src="/flying-feathers-logo.png"
                  alt="Flying Feathers"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </div>
          </motion.div>

          <p className="hero-intro hero-kicker text-[11px] uppercase tracking-[0.38em] text-teal-200/90 font-medium mb-5">
            Established 2018 · Edinburgh
          </p>

          <h1 className="font-semibold tracking-tight mb-6 leading-[0.92] text-[3.4rem] sm:text-7xl md:text-8xl">
            <span className="hero-intro hero-title-word inline-block text-white">Flying</span>{' '}
            <span className="hero-intro hero-title-word inline-block text-teal-100">Feathers</span>
          </h1>

          <div className="hero-intro hero-rule w-16 h-px bg-teal-200/50 mb-7" />

          <p className="hero-intro hero-copy text-base sm:text-lg text-slate-300/90 max-w-xl mb-10 leading-relaxed font-light">
            A members&apos; badminton club for organised play, city tournaments,
            and a community that takes the court seriously — and enjoys it.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <ClubLink tone="accent" onClick={() => router.push('/player/login')}>
              Member Login
            </ClubLink>
            <ClubLink tone="line" onClick={() => router.push('/schedules')}>
              Live Tournaments
            </ClubLink>
            <ClubLink tone="ghost" onClick={() => router.push('/club-info')}>
              About the Club
            </ClubLink>
          </div>

          <div className="hero-intro hero-meta mt-14 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[11px] uppercase tracking-[0.28em] text-slate-400">
            <span>Members</span>
            <span className="text-teal-200/40">·</span>
            <span>Courts</span>
            <span className="text-teal-200/40">·</span>
            <span>Tournaments</span>
          </div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-[10px] tracking-[0.32em] uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </section>
    </MotionConfig>
  );
}
