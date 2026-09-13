'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Users, CheckCircle, Clock, TrendingUp, Plus, History, ArrowRight } from 'lucide-react';

interface Tournament {
  _id: string;
  name: string;
  tournamentFormat: 'court-based' | 'round-robin' | 'championship-groups';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed';
  scheduledDate: string;
  numberOfTeams: number;
  createdAt: string;
}

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
}

function MetricCard({ title, value, icon, gradient, subtitle }: MetricCardProps) {
  return (
    <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <div className="text-slate-500">{icon}</div>
      </div>
      <p className={`text-4xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {value}
      </p>
      {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatBadge(format: string) {
  const map: Record<string, { label: string; color: string }> = {
    'court-based': { label: 'Court-Based', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    'round-robin': { label: 'Round-Robin', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    'championship-groups': { label: 'Championship', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  };
  const entry = map[format] ?? { label: format, color: 'bg-slate-700 text-slate-300 border-slate-600' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${entry.color}`}>
      {entry.label}
    </span>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    scheduled: 'bg-slate-700 text-slate-300 border-slate-600',
    confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'in-progress': 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${map[status] ?? 'bg-slate-700 text-slate-300'}`}>
      {status.replace('-', ' ')}
    </span>
  );
}

export default function OverviewPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name) setUserName(parsed.name.split(' ')[0]);
      }
    } catch { /* ignore */ }

    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTournaments(data.tournaments ?? []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const total = tournaments.length;
  const active = tournaments.filter(t => t.status === 'in-progress').length;
  const completed = tournaments.filter(t => t.status === 'completed').length;
  const scheduled = tournaments.filter(t => t.status === 'scheduled' || t.status === 'confirmed').length;

  const byFormat = {
    'court-based': tournaments.filter(t => t.tournamentFormat === 'court-based').length,
    'round-robin': tournaments.filter(t => t.tournamentFormat === 'round-robin').length,
    'championship-groups': tournaments.filter(t => t.tournamentFormat === 'championship-groups').length,
  };
  const maxFormat = Math.max(...Object.values(byFormat), 1);

  const recent = [...tournaments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          {getGreeting()}, {userName}! 👋
        </h1>
        <p className="text-slate-400 mt-1">Here&apos;s what&apos;s happening at Flying Feathers today.</p>
      </div>

      {/* Metric cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-900/60 border border-white/8 rounded-2xl p-6 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Tournaments"
            value={total}
            gradient="from-cyan-400 to-blue-400"
            icon={<Trophy size={20} />}
            subtitle="All time"
          />
          <MetricCard
            title="Active Now"
            value={active}
            gradient="from-green-400 to-emerald-400"
            icon={<TrendingUp size={20} />}
            subtitle="In progress"
          />
          <MetricCard
            title="Completed"
            value={completed}
            gradient="from-yellow-400 to-orange-400"
            icon={<CheckCircle size={20} />}
            subtitle="Finished"
          />
          <MetricCard
            title="Upcoming"
            value={scheduled}
            gradient="from-pink-400 to-purple-400"
            icon={<Clock size={20} />}
            subtitle="Scheduled / Confirmed"
          />
        </div>
      )}

      {/* Two-column row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Tournament breakdown by format */}
        <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-cyan-400" />
            Format Breakdown
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 bg-slate-800 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { key: 'court-based', label: 'Court-Based', color: 'bg-cyan-500' },
                { key: 'round-robin', label: 'Round-Robin', color: 'bg-purple-500' },
                { key: 'championship-groups', label: 'Championship Groups', color: 'bg-amber-500' },
              ].map(({ key, label, color }) => {
                const count = byFormat[key as keyof typeof byFormat];
                const pct = total === 0 ? 0 : Math.round((count / maxFormat) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{label}</span>
                      <span className="text-slate-400 font-mono">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {total === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No tournaments yet</p>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <History size={16} className="text-pink-400" />
              Recent Tournaments
            </h2>
            <Link href="/dashboard/tournaments" className="text-cyan-400 text-xs hover:text-cyan-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-800 rounded animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No tournaments yet</p>
          ) : (
            <div className="space-y-3">
              {recent.map(t => (
                <div key={t._id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm font-medium truncate">{t.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {new Date(t.scheduledDate).toLocaleDateString()} · {t.numberOfTeams} teams
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {formatBadge(t.tournamentFormat)}
                    {statusBadge(t.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard/tournaments"
            className="group bg-slate-900/60 border border-white/8 hover:border-cyan-500/40 rounded-2xl p-5 flex items-center gap-4 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/25 transition-colors">
              <Plus size={18} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Create Tournament</p>
              <p className="text-slate-500 text-xs mt-0.5">Start a new event</p>
            </div>
            <ArrowRight size={16} className="text-slate-600 ml-auto group-hover:text-cyan-400 transition-colors" />
          </Link>

          <Link
            href="/dashboard/players"
            className="group bg-slate-900/60 border border-white/8 hover:border-pink-500/40 rounded-2xl p-5 flex items-center gap-4 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-pink-500/25 transition-colors">
              <Users size={18} className="text-pink-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">View Players</p>
              <p className="text-slate-500 text-xs mt-0.5">Manage registered members</p>
            </div>
            <ArrowRight size={16} className="text-slate-600 ml-auto group-hover:text-pink-400 transition-colors" />
          </Link>

          <Link
            href="/dashboard/history"
            className="group bg-slate-900/60 border border-white/8 hover:border-yellow-500/40 rounded-2xl p-5 flex items-center gap-4 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-500/25 transition-colors">
              <History size={18} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">View History</p>
              <p className="text-slate-500 text-xs mt-0.5">See completed tournaments</p>
            </div>
            <ArrowRight size={16} className="text-slate-600 ml-auto group-hover:text-yellow-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
