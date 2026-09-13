'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronUp, Users } from 'lucide-react';

interface Player {
  _id: string;
  supabaseId: string;
  name: string;
  email: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'competitive';
  yearsOfExperience?: number;
  preferredHand?: 'left' | 'right' | 'ambidextrous';
  onboardingCompleted: boolean;
  createdAt: string;
  gender?: string;
  phone?: string;
}

function SkillBadge({ level }: { level?: string }) {
  if (!level) return <span className="text-slate-500 text-xs">—</span>;
  const map: Record<string, string> = {
    beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
    intermediate: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    advanced: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    competitive: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${map[level] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
      {level}
    </span>
  );
}

function PlayerRow({ player }: { player: Player }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900/60 border border-white/8 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">
            {player.name?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        </div>

        {/* Name + email */}
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{player.name}</p>
          <p className="text-slate-400 text-xs truncate">{player.email}</p>
        </div>

        {/* Skill level */}
        <div className="hidden sm:flex">
          <SkillBadge level={player.skillLevel} />
        </div>

        {/* Years exp */}
        <div className="hidden md:block">
          <p className="text-slate-300 text-sm">{player.yearsOfExperience ?? '—'}</p>
          <p className="text-slate-500 text-xs">yrs</p>
        </div>

        {/* Joined */}
        <div className="hidden lg:block">
          <p className="text-slate-300 text-xs">{new Date(player.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Onboarding status */}
        <div>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${
            player.onboardingCompleted
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : 'bg-slate-700 text-slate-400 border-slate-600'
          }`}>
            {player.onboardingCompleted ? 'Active' : 'Pending'}
          </span>
        </div>

        {/* Expand icon */}
        <div className="text-slate-500">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-white/5 px-4 py-4 bg-slate-800/30">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs mb-1">Skill Level</p>
              <SkillBadge level={player.skillLevel} />
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Years of Experience</p>
              <p className="text-slate-300">{player.yearsOfExperience ?? 'Not specified'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Preferred Hand</p>
              <p className="text-slate-300 capitalize">{player.preferredHand ?? 'Not specified'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Gender</p>
              <p className="text-slate-300 capitalize">{player.gender?.replace('_', ' ') ?? 'Not specified'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Phone</p>
              <p className="text-slate-300">{player.phone ?? 'Not provided'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Onboarding</p>
              <p className={player.onboardingCompleted ? 'text-green-400' : 'text-slate-400'}>
                {player.onboardingCompleted ? '✓ Completed' : 'Incomplete'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Joined</p>
              <p className="text-slate-300">{new Date(player.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Supabase ID</p>
              <p className="text-slate-500 text-xs font-mono truncate">{player.supabaseId}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch('/api/admin/players', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.players ?? []);
        } else {
          setError('Failed to load players');
        }
      } catch {
        setError('Failed to load players');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const filtered = players.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.skillLevel?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-pink-400" />
            Players
          </h1>
          <p className="text-slate-400 mt-1">
            {loading ? 'Loading…' : `${players.length} registered player${players.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or skill level…"
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-white/8 rounded-xl text-slate-200 placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
        />
      </div>

      {/* Column headers (desktop) */}
      <div className="hidden md:grid grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-4 py-2 text-xs text-slate-500 font-medium uppercase tracking-wide">
        <span className="w-9" />{/* avatar spacer */}
        <span>Player</span>
        <span className="hidden sm:block">Skill Level</span>
        <span className="hidden md:block">Experience</span>
        <span className="hidden lg:block">Joined</span>
        <span>Status</span>
        <span />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-900/60 border border-white/8 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-white/8 rounded-xl p-12 text-center">
          <Users size={32} className="text-slate-600 mx-auto mb-3" />
          {search ? (
            <p className="text-slate-400">No players match &ldquo;{search}&rdquo;</p>
          ) : (
            <>
              <p className="text-slate-300 font-medium">No players yet</p>
              <p className="text-slate-500 text-sm mt-1">Players appear here once they complete onboarding</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(player => (
            <PlayerRow key={player._id} player={player} />
          ))}
        </div>
      )}
    </div>
  );
}
