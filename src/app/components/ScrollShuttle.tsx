'use client';

import { useRef } from 'react';
import { motion, MotionConfig, useScroll, useSpring, useTransform } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

function ShuttleMark() {
  return (
    <svg viewBox="0 0 80 92" className="w-full h-full" fill="none" aria-hidden>
      <path d="M16 50c-6-16-6-30 2-42 6 8 12 18 14 30-8 2-12 6-16 12Z" stroke="currentColor" strokeWidth="0.9" />
      <path d="M64 50c6-16 6-30-2-42-6 8-12 18-14 30 8 2 12 6 16 12Z" stroke="currentColor" strokeWidth="0.9" />
      <path d="M24 52c-4-18-2-34 8-46 5 10 8 22 8 34-6 2-12 6-16 12Z" stroke="currentColor" strokeWidth="0.9" />
      <path d="M56 52c4-18 2-34-8-46-5 10-8 22-8 34 6 2 12 6 16 12Z" stroke="currentColor" strokeWidth="0.9" />
      <path d="M40 4c-3 16-4 30 0 48 4-18 3-32 0-48Z" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="40" cy="56" rx="16" ry="5" stroke="currentColor" strokeWidth="0.9" />
      <path d="M29 61c1.6 10 4.4 18 11 22 6.6-4 9.4-12 11-22" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}

export default function ScrollShuttle() {
  const wrap = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ trackContentSize: true });
  const progress = useSpring(scrollYProgress, { stiffness: 36, damping: 28, restDelta: 0.001 });
  const opacity = useTransform(progress, [0, 0.25, 1], [0.06, 0.09, 0.07]);

  useGSAP(() => {
    const el = mark.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.fromTo(
      el,
      { scale: 1 },
      {
        scale: 1.12,
        ease: 'none',
        scrollTrigger: {
          trigger: 'main',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2.4,
          invalidateOnRefresh: true,
        },
      },
    );

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, { scope: wrap });

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={wrap}
        className="pointer-events-none fixed inset-0 z-0 hidden items-center justify-end overflow-hidden pr-[6vw] pt-[8vh] motion-safe:flex"
        aria-hidden
      >
        <motion.div
          ref={mark}
          className="scroll-shuttle w-[min(38vw,20rem)] text-teal-100/55 will-change-transform"
          style={{ opacity }}
        >
          <ShuttleMark />
        </motion.div>
      </div>
    </MotionConfig>
  );
}
