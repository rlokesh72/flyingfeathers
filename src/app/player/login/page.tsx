'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Feather, Mail, Lock, Eye, EyeOff, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ── Inner component that uses useSearchParams ─────────────────────────── */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // The page the player should land on after a successful login
  const redirectTo = searchParams.get('redirect') || '';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      setError('Authentication failed. Please try again.');
    }
    // If already logged in, honour the redirect or fall back to portal
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push(redirectTo || '/player/portal');
    });
  }, []);

  /* ── Helpers ──────────────────────────────────────────────────── */

  /** Navigate to the right place after a successful login. */
  const afterLogin = async (userId: string) => {
    const res = await fetch(`/api/player/profile?supabaseId=${userId}`);
    if (res.ok) {
      const profile = await res.json();
      if (!profile?.onboardingCompleted) {
        // Stash redirect so onboarding can forward to it afterwards
        const dest = redirectTo ? `/player/onboarding?redirect=${encodeURIComponent(redirectTo)}` : '/player/onboarding';
        router.push(dest);
      } else {
        router.push(redirectTo || '/player/portal');
      }
    } else {
      const dest = redirectTo ? `/player/onboarding?redirect=${encodeURIComponent(redirectTo)}` : '/player/onboarding';
      router.push(dest);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    // Pass the redirect destination through the OAuth state via the callback URL
    const callbackUrl = redirectTo
      ? `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
      : `${window.location.origin}/api/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      // Email confirmation required — preserve the redirect in the success banner
      setSuccessMsg(
        redirectTo
          ? 'Account created! Check your email to confirm, then log in here to continue your registration.'
          : 'Account created! Please check your email and click the confirmation link, then log in here.'
      );
      setMode('login');
      setLoading(false);
      return;
    } else {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        await afterLogin(data.user.id);
        return; // afterLogin handles navigation
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mb-4">
            <Feather className="w-6 h-6 text-cyan-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-white">Flying Feathers</h1>
          <p className="text-slate-400 text-sm mt-1">
            {redirectTo ? 'Log in to complete your registration' : 'Player Portal'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur border border-white/8 rounded-2xl p-8 shadow-2xl">
          {/* Tab toggle */}
          <div className="flex bg-slate-800/60 rounded-xl p-1 mb-8">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  mode === m
                    ? 'bg-cyan-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all duration-200 mb-6 disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-slate-500 text-xs uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-slate-800/60 border border-white/8 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-800/60 border border-white/8 rounded-xl pl-10 pr-10 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-3 text-cyan-400 text-sm">
                {successMsg}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white border-0 py-6 text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : mode === 'login' ? 'Log In' : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Admin?{' '}
          <a href="/login" className="text-slate-400 hover:text-white transition">
            Admin login →
          </a>
        </p>
      </div>
    </div>
  );
}

/* ── Page export wrapped in Suspense (required for useSearchParams) ─────── */
export default function PlayerLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
