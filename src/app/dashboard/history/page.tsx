'use client';

import { useEffect, useState } from 'react';
import { History, ChevronDown, ChevronUp, Trophy } from 'lucide-react';

interface TeamStats {
  teamIndex: number;
  teamName: string;
  players: string[];
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  matchesPlayed: number;
}

interface Tournament {
  _id: string;
  name: string;
  description?: string;
  tournamentFormat: 'court-based' | 'round-robin' | 'championship-groups';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed';
  scheduledDate: string;
  numberOfTeams: number;
  matches: { status: string }[];
  standings?: TeamStats[];
  teams: { name: string; players: string[] }[];
  createdAt: string;
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

function TournamentHistoryCard({ tournament }: { tournament: Tournament }) {
  const [expanded, setExpanded] = useState(false);
  const winner = tournament.standings?.[0];
  const completedMatches = tournament.matches?.filter(m => m.status === 'completed').length ?? 0;

  return (
    <div className="bg-slate-900/60 border border-white/8 rounded-2xl overflow-hidden">
      {/* Card header / summary row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/3 transition-colors"
      >
        {/* Trophy icon */}
        <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
          <Trophy size={18} className="text-yellow-400" />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{tournament.name}</p>
          <p className="text-slate-400 text-xs mt-0.5">
            {new Date(tournament.scheduledDate).toLocaleDateString()} ·{' '}
            {tournament.numberOfTeams} teams ·{' '}
            {completedMatches} matches played
          </p>
        </div>

        {/* Format badge */}
        <div className="hidden sm:block flex-shrink-0">
          {formatBadge(tournament.tournamentFormat)}
        </div>

        {/* Winner snippet */}
        {winner && (
          <div className="hidden md:block flex-shrink-0 text-right">
            <p className="text-yellow-400 text-xs font-semibold">🥇 {winner.teamName}</p>
            <p className="text-slate-500 text-xs">{winner.wins}W · {winner.losses}L</p>
          </div>
        )}

        <div className="text-slate-500 flex-shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded standings table */}
      {expanded && (
        <div className="border-t border-white/5 px-5 py-4 bg-slate-800/30">
          {tournament.standings && tournament.standings.length > 0 ? (
            <>
              <h3 className="text-slate-300 text-sm font-semibold mb-3">Final Standings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-2 text-cyan-400 text-xs font-medium">#</th>
                      <th className="text-left py-2 px-2 text-cyan-400 text-xs font-medium">Team</th>
                      <th className="text-left py-2 px-2 text-cyan-400 text-xs font-medium hidden sm:table-cell">Players</th>
                      <th className="text-center py-2 px-2 text-cyan-400 text-xs font-medium">W</th>
                      <th className="text-center py-2 px-2 text-cyan-400 text-xs font-medium">L</th>
                      <th className="text-center py-2 px-2 text-cyan-400 text-xs font-medium">+/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournament.standings.map((team, index) => (
                      <tr
                        key={team.teamIndex}
                        className={`border-b border-slate-700/50 ${
                          index === 0 ? 'bg-yellow-900/10' :
                          index === 1 ? 'bg-slate-700/10' :
                          index === 2 ? 'bg-orange-900/10' : ''
                        }`}
                      >
                        <td className="py-2 px-2">
                          <span className={`font-bold ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-slate-300' :
                            index === 2 ? 'text-orange-400' :
                            'text-slate-500'
                          }`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-white text-sm">{team.teamName}</td>
                        <td className="py-2 px-2 text-slate-400 text-xs hidden sm:table-cell">
                          {team.players.filter(p => p.trim()).join(', ') || '—'}
                        </td>
                        <td className="py-2 px-2 text-center text-green-400 font-semibold">{team.wins}</td>
                        <td className="py-2 px-2 text-center text-red-400 font-semibold">{team.losses}</td>
                        <td className={`py-2 px-2 text-center font-semibold ${
                          team.pointDifference > 0 ? 'text-green-400' :
                          team.pointDifference < 0 ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {team.pointDifference > 0 ? '+' : ''}{team.pointDifference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm">No standings data available for this tournament.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [completed, setCompleted] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/tournaments', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const done = (data.tournaments ?? [])
            .filter((t: Tournament) => t.status === 'completed')
            .sort((a: Tournament, b: Tournament) =>
              new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
            );
          setCompleted(done);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <History size={22} className="text-yellow-400" />
          Tournament History
        </h1>
        <p className="text-slate-400 mt-1">
          {loading ? 'Loading…' : `${completed.length} completed tournament${completed.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-900/60 border border-white/8 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : completed.length === 0 ? (
        <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-16 text-center">
          <History size={36} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">No completed tournaments yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Completed tournaments will appear here with their final standings
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {completed.map(t => (
            <TournamentHistoryCard key={t._id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
}
