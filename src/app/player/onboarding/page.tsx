'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Feather, ChevronRight, ChevronLeft, User, Phone, Activity, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  { id: 1, label: 'Personal',   icon: User     },
  { id: 2, label: 'Experience', icon: Activity },
  { id: 3, label: 'Emergency',  icon: Shield   },
];

interface FormData {
  name: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  skillLevel: string;
  yearsOfExperience: string;
  preferredHand: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  );
}

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '';
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    skillLevel: '',
    yearsOfExperience: '',
    preferredHand: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/player/login'); return; }
      setUserId(user.id);
      setUserEmail(user.email ?? '');
      // Pre-fill name from Google if available
      if (user.user_metadata?.full_name) {
        setForm((f) => ({ ...f, name: user.user_metadata.full_name }));
      }
    });
  }, []);

  const set = (field: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const canProceed = () => {
    if (step === 1) return form.name.trim() && form.dateOfBirth && form.gender;
    if (step === 2) return form.skillLevel && form.preferredHand;
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/player/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseId: userId,
          email: userEmail,
          name: form.name,
          phone: form.phone || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          gender: form.gender || undefined,
          skillLevel: form.skillLevel || undefined,
          yearsOfExperience: form.yearsOfExperience
            ? Number(form.yearsOfExperience)
            : undefined,
          preferredHand: form.preferredHand || undefined,
          emergencyContactName: form.emergencyContactName || undefined,
          emergencyContactPhone: form.emergencyContactPhone || undefined,
          onboardingCompleted: true,
        }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      router.push(redirectTo || '/player/portal');
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pink-500/6 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mb-4">
            <Feather className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to Flying Feathers</h1>
          <p className="text-slate-400 text-sm mt-1">Let&apos;s set up your player profile</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex flex-col items-center`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2
                      ${done    ? 'bg-cyan-500 border-cyan-500'        : ''}
                      ${active  ? 'bg-cyan-500/10 border-cyan-500'     : ''}
                      ${!done && !active ? 'bg-slate-800 border-slate-700' : ''}`}
                  >
                    {done ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-500'}`} strokeWidth={1.75} />
                    )}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${active ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-16 h-px mx-2 mb-4 transition-all duration-300 ${step > s.id ? 'bg-cyan-500' : 'bg-slate-700'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur border border-white/8 rounded-2xl p-8 shadow-2xl">

          {/* STEP 1 – Personal Details */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white mb-1">Personal Details</h2>
              <p className="text-slate-400 text-sm mb-5">Tell us a little about yourself.</p>

              <Field label="Full Name *">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Alex Kumar"
                  className={inputCls}
                />
              </Field>

              <Field label="Date of Birth *">
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set('dateOfBirth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={inputCls}
                />
              </Field>

              <Field label="Gender *">
                <div className="grid grid-cols-3 gap-2">
                  {[['male', 'Male'], ['female', 'Female'], ['prefer_not_to_say', 'Prefer not to say']].map(([v, l]) => (
                    <ToggleBtn key={v} active={form.gender === v} onClick={() => set('gender', v)}>
                      {l}
                    </ToggleBtn>
                  ))}
                </div>
              </Field>

              <Field label="Phone Number">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+44 7700 000000"
                  className={inputCls}
                />
              </Field>
            </div>
          )}

          {/* STEP 2 – Playing Experience */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white mb-1">Playing Experience</h2>
              <p className="text-slate-400 text-sm mb-5">Help us understand your badminton background.</p>

              <Field label="Skill Level *">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['beginner',     'Beginner',     'Just starting out'],
                    ['intermediate', 'Intermediate', 'Club / social player'],
                    ['advanced',     'Advanced',     'League / tournament player'],
                    ['competitive',  'Competitive',  'County / national level'],
                  ].map(([v, l, d]) => (
                    <button
                      key={v}
                      onClick={() => set('skillLevel', v)}
                      className={`text-left p-3 rounded-xl border transition-all duration-200
                        ${form.skillLevel === v
                          ? 'border-cyan-500 bg-cyan-500/10 text-white'
                          : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'}`}
                    >
                      <p className="text-sm font-medium">{l}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{d}</p>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Years of Experience">
                <input
                  type="number"
                  value={form.yearsOfExperience}
                  onChange={(e) => set('yearsOfExperience', e.target.value)}
                  min={0} max={50}
                  placeholder="0"
                  className={inputCls}
                />
              </Field>

              <Field label="Preferred Hand *">
                <div className="grid grid-cols-3 gap-2">
                  {[['left', 'Left'], ['right', 'Right'], ['ambidextrous', 'Both']].map(([v, l]) => (
                    <ToggleBtn key={v} active={form.preferredHand === v} onClick={() => set('preferredHand', v)}>
                      {l}
                    </ToggleBtn>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* STEP 3 – Emergency Contact */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white mb-1">Emergency Contact</h2>
              <p className="text-slate-400 text-sm mb-5">Optional but recommended for tournament safety.</p>

              <Field label="Contact Name">
                <input
                  type="text"
                  value={form.emergencyContactName}
                  onChange={(e) => set('emergencyContactName', e.target.value)}
                  placeholder="e.g. Jane Kumar"
                  className={inputCls}
                />
              </Field>

              <Field label="Contact Phone">
                <input
                  type="tel"
                  value={form.emergencyContactPhone}
                  onChange={(e) => set('emergencyContactPhone', e.target.value)}
                  placeholder="+44 7700 000000"
                  className={inputCls}
                />
              </Field>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 py-6"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white border-0 py-6 font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-40"
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white border-0 py-6 font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  'Complete Setup 🎉'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small reusable components ─────────────────────────────── */
const inputCls =
  'w-full bg-slate-800/60 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ToggleBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all duration-200
        ${active
          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
          : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'}`}
    >
      {children}
    </button>
  );
}
