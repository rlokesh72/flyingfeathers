'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, Building2, Bell, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="text-white font-semibold">{title}</h2>
        {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function SettingsCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900/60 border border-white/8 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings size={22} className="text-slate-400" />
          Settings
        </h1>
        <p className="text-slate-400 mt-1">Manage your account and club preferences</p>
      </div>

      {/* ── Account ── */}
      <SettingsCard>
        <SectionHeader
          icon={<User size={16} className="text-cyan-400" />}
          title="Account"
          subtitle="Your admin account details"
        />
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Full Name</label>
              <div className="px-3 py-2 bg-slate-800 border border-white/8 rounded-lg text-slate-300 text-sm">
                {user?.name ?? '—'}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email Address</label>
              <div className="px-3 py-2 bg-slate-800 border border-white/8 rounded-lg text-slate-300 text-sm">
                {user?.email ?? '—'}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Role</label>
              <div className="px-3 py-2 bg-slate-800 border border-white/8 rounded-lg text-slate-300 text-sm capitalize">
                {user?.role ?? 'admin'}
              </div>
            </div>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => router.push('/change-password')}
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 flex items-center gap-2"
            >
              Change Password
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </SettingsCard>

      {/* ── Club Information ── */}
      <SettingsCard>
        <SectionHeader
          icon={<Building2 size={16} className="text-pink-400" />}
          title="Club Information"
          subtitle="Details about Flying Feathers Badminton Club"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Club Name', value: 'Flying Feathers Badminton Club' },
            { label: 'Location', value: 'London, United Kingdom' },
            { label: 'Contact Email', value: 'admin@flyingfeathers.club' },
            { label: 'Website', value: 'flyingfeathers.club' },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">{label}</label>
              <div className="px-3 py-2 bg-slate-800 border border-white/8 rounded-lg text-slate-300 text-sm">
                {value}
              </div>
            </div>
          ))}
        </div>
        <p className="text-slate-600 text-xs mt-4">Club information editing coming in a future update.</p>
      </SettingsCard>

      {/* ── Notifications ── */}
      <SettingsCard>
        <SectionHeader
          icon={<Bell size={16} className="text-purple-400" />}
          title="Notifications"
          subtitle="Manage how and when you receive alerts"
        />
        <div className="space-y-3">
          {[
            { label: 'Email notifications for new registrations', description: 'Get notified when a team registers for a championship' },
            { label: 'Match completion alerts', description: 'Receive alerts when all matches in a tournament are done' },
            { label: 'Weekly digest', description: 'A weekly summary of club activity' },
          ].map(({ label, description }) => (
            <div key={label} className="flex items-center justify-between gap-4 p-3 bg-slate-800/50 rounded-xl border border-white/5">
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-sm font-medium">{label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-600 italic">Coming soon</span>
                <button
                  disabled
                  className="relative inline-flex h-5 w-9 items-center rounded-full bg-slate-700 cursor-not-allowed opacity-50"
                  aria-label="Toggle"
                >
                  <span className="inline-block h-3.5 w-3.5 translate-x-1 transform rounded-full bg-slate-500 transition" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* ── Danger Zone ── */}
      <div className="bg-red-950/20 border border-red-700/30 rounded-2xl p-6">
        <SectionHeader
          icon={<AlertTriangle size={16} className="text-red-400" />}
          title="Danger Zone"
          subtitle="Irreversible and destructive actions"
        />
        <div className="flex items-center justify-between gap-4 p-4 bg-red-950/30 border border-red-700/20 rounded-xl">
          <div>
            <p className="text-red-300 text-sm font-semibold">Delete Admin Account</p>
            <p className="text-red-400/60 text-xs mt-0.5">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <Button
            disabled
            variant="outline"
            className="border-red-700/40 text-red-500/50 cursor-not-allowed flex-shrink-0 opacity-60"
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
