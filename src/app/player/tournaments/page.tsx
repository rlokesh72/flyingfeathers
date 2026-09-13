'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Feather, Trophy, Calendar, Users, ChevronRight, ArrowLeft, Clock } from 'lucide-react';

interface Tournament {
  _id: string;
  name: string;
  description?: string;
  scheduledDate: string;
  maxTeams: number;
  teamsPerGroup?: number;
  numberOfGroups?: number;
  championshipStatus: string;
  registrationOpen: boolean;
  acceptedCount: number;
  pendingCount: number;
  totalRegistrations: number;
}

const STATUS_LABELS: Record<string, { label: string; colour: string }> = {
  registration_open:       { label: 'Registration Open',    colour: 'text-green-400 bg-green-400/10 border-green-400/20' },
  registration_closed:     { label: 'Registration Closed',  colour: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  groups_generated:        { label: 'Groups Set',           colour: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
  group_stage_active:      { label: 'Group Stage Live',     colour: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
  group_stage_completed:   { label: 'Group Stage Done',     colour: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  knockouts_generated:     { label: 'Knockouts Set',        colour: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
  knockouts_active:        { label: 'Knockouts Live',       colour: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
  completed:               { label: 'Completed',            colour: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
};

export default function PlayerTournamentsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/player/login');
    });
    fetch('/api/player/tournaments')
      .then((r) => r.json())
      .then((d) => { setTournaments(d.tournaments ?? []); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.push('/player/portal')} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Feather className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
          <span className="font-semibold text-sm">Tournaments</span>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upcoming Tournaments</h1>
          <p className="text-slate-400">Find a tournament and register your team</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No tournaments available right now.</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map((t) => {
              const s = STATUS_LABELS[t.championshipStatus] ?? { label: t.championshipStatus, colour: 'text-slate-400 bg-slate-400/10 border-slate-400/20' };
              const spotsLeft = t.maxTeams - t.acceptedCount;
              return (
                <div
                  key={t._id}
                  onClick={() => router.push(`/player/tournaments/${t._id}`)}
                  className="group bg-slate-900/60 border border-white/6 hover:border-cyan-500/30 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="text-lg font-semibold text-white">{t.name}</h2>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.colour}`}>
                          {s.label}
                        </span>
                      </div>
                      {t.description && <p className="text-slate-400 text-sm mb-3 line-clamp-2">{t.description}</p>}
                      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(t.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {t.acceptedCount}/{t.maxTeams} teams confirmed
                        </span>
                        {t.teamsPerGroup && (
                          <span className="flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5" />
                            {t.numberOfGroups} groups of {t.teamsPerGroup}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {t.registrationOpen && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-cyan-400">{spotsLeft}</p>
                          <p className="text-xs text-slate-500">spots left</p>
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
