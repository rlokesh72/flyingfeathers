'use client';

import { useRef } from 'react';
import { motion, MotionConfig } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Trophy,
  CalendarDays,
  Activity,
  Users,
  TrendingUp,
  Smartphone,
} from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const reveal = { duration: 0.42, ease: 'easeOut' as const };

const offers = [
  {
    Icon: Trophy,
    title: 'Tournament Management',
    desc: 'Create, manage, and run complete tournaments — brackets, schedules, results all in one place.',
  },
  {
    Icon: CalendarDays,
    title: 'Court Scheduling',
    desc: 'Smart court allocation that optimises playing time and minimises wait periods across all sessions.',
  },
  {
    Icon: Activity,
    title: 'Live Scoring',
    desc: 'Real-time match scoring with live leaderboards and automatic standings updates.',
  },
  {
    Icon: Users,
    title: 'Player Registration',
    desc: 'Streamlined sign-up with player profiles and skill tracking for every member.',
  },
  {
    Icon: TrendingUp,
    title: 'Rankings & Stats',
    desc: 'Comprehensive player statistics and rankings that reflect real competitive performance.',
  },
  {
    Icon: Smartphone,
    title: 'Mobile Friendly',
    desc: 'Fully responsive — check scores, schedules and standings on any device, anywhere.',
  },
];

export default function ClubOffer() {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const rule = root.current?.querySelector('.offer-rule');
    if (!rule) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.fromTo(
      rule,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 0.55,
        ease: 'power2.out',
        transformOrigin: 'center',
        scrollTrigger: {
          trigger: root.current,
          start: 'top 80%',
          once: true,
        },
      },
    );

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, { scope: root });

  return (
    <MotionConfig reducedMotion="user">
      <section ref={root} className="club-offer relative py-28 border-y border-teal-200/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-16">
            <motion.p
              className="text-[11px] uppercase tracking-[0.38em] text-teal-200/90 font-medium mb-5"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={reveal}
            >
              What We Offer
            </motion.p>
            <motion.h2
              className="font-semibold tracking-tight text-4xl md:text-5xl text-white mb-7"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ ...reveal, delay: 0.06 }}
            >
              Everything You Need to Compete
            </motion.h2>
            <div className="offer-rule w-16 h-px bg-teal-200/50" />
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-white/10">
            {offers.map(({ Icon, title, desc }, i) => (
              <motion.article
                key={title}
                className="border-r border-b border-white/10 px-7 py-8 md:px-8 md:py-10"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ ...reveal, delay: 0.04 + i * 0.05 }}
                whileHover={{ backgroundColor: 'rgba(45, 212, 191, 0.04)' }}
              >
                <span className="block text-[10px] uppercase tracking-[0.28em] text-teal-200/45 mb-6">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Icon className="w-4 h-4 text-teal-200/75 mb-5" strokeWidth={1.4} />
                <h3 className="text-[15px] font-medium tracking-wide text-teal-50 mb-3">
                  {title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  {desc}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
