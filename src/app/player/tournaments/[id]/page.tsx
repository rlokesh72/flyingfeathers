'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Feather, ArrowLeft, Users, Trophy, Calendar,
  Search, Check, Send, UserPlus, Loader2, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  qualificationRules?: { gold: number[]; silver: number[]; bronze: number[] };
}

interface AvailablePlayer {
  supabaseId: string;
  name: string;
  email: string;
  skillLevel?: string;
}

interface MyReg {
  registrationId: string;
  teamName: string;
  player1Name: string;
  player2Name?: string;
  partnerStatus: 'none' | 'requested' | 'confirmed';
  status: string;
}

const SKILL_COLOUR: Record<string, string> = {
  beginner: 'text-green-400', intermediate: 'text-cyan-400',
  advanced: 'text-purple-400', competitive: 'text-pink-400',
};

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [myReg, setMyReg]             = useState<MyReg | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayer[]>([]);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [registering, setRegistering] = useState(false);
  const [inviting, setInviting]       = useState<string | null>(null);
  const [msg, setMsg]                 = useState('');
  const [error, setError]             = useState('');
  const [loggedIn, setLoggedIn]       = useState(false);

  /* ── Load tournament (public) + registration status (if authed) ── */
  useEffect(() => {
    (async () => {
      // 1. Always load tournament — visible to everyone
      const tRes = await fetch(`/api/player/tournaments/${id}`);
      if (tRes.ok) {
        const d = await tRes.json();
        setTournament(d.tournament);
      }

      // 2. Only load registration state if the user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setLoggedIn(true);
        const regsRes = await fetch('/api/player/registrations');
        if (regsRes.ok) {
          const d = await regsRes.json();
          const found = (d.myRegistrations ?? []).find((r: any) => r.tournamentId === id);
          if (found) {
            setMyReg(found);
            const apRes = await fetch(`/api/player/tournaments/${id}/available-players`);
            if (apRes.ok) {
              const apData = await apRes.json();
              setAvailablePlayers(apData.players ?? []);
            }
          }
        }
      }

      setLoading(false);
    })();
  }, [id]);

  /* ── Register ────────────────────────────────────────────────── */
  const handleRegister = async () => {
    // Not logged in → go to login, come straight back here after
    if (!loggedIn) {
      router.push(`/player/login?redirect=/player/tournaments/${id}`);
      return;
    }

    setRegistering(true);
    setError('');
    const res = await fetch(`/api/player/tournaments/${id}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(data.message);
      setMyReg({
        registrationId: data.registration._id,
        teamName: data.registration.teamName,
        player1Name: data.registration.player1Name,
        partnerStatus: 'none',
        status: data.registration.status,
      });
      const apRes = await fetch(`/api/player/tournaments/${id}/available-players`);
      if (apRes.ok) { const d = await apRes.json(); setAvailablePlayers(d.players ?? []); }
    } else {
      setError(data.error ?? 'Registration failed');
    }
    setRegistering(false);
  };

  /* ── Invite partner ──────────────────────────────────────────── */
  const handleInvite = async (partnerSupabaseId: string, partnerName: string) => {
    setInviting(partnerSupabaseId);
    setError('');
    const res = await fetch(`/api/player/registrations/${id}/${myReg!.registrationId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerSupabaseId }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(`Partner request sent to ${partnerName}!`);
      setMyReg((prev) => prev ? { ...prev, player2Name: partnerName, partnerStatus: 'requested' } : prev);
    } else {
      setError(data.error ?? 'Failed to send invite');
    }
    setInviting(null);
  };

  const filtered = availablePlayers.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Loading ─────────────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );

  if (!tournament) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
      Tournament not found
    </div>
  );

  const spotsLeft = tournament.maxTeams - tournament.acceptedCount;

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Feather className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
          <span className="font-semibold text-sm truncate">{tournament.name}</span>
          {!loggedIn && (
            <button
              onClick={() => router.push(`/player/login?redirect=/player/tournaments/${id}`)}
              className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition"
            >
              <Lock className="w-3 h-3" /> Log in
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-3xl space-y-6">

        {/* Tournament header */}
        <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-white mb-2">{tournament.name}</h1>
          {tournament.description && (
            <p className="text-slate-400 text-sm mb-4">{tournament.description}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Date',       value: new Date(tournament.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
              { label: 'Max Teams',  value: tournament.maxTeams },
              { label: 'Groups',     value: tournament.numberOfGroups ? `${tournament.numberOfGroups} × ${tournament.teamsPerGroup}` : '—' },
              { label: 'Spots Left', value: Math.max(0, spotsLeft), color: spotsLeft <= 5 ? 'text-yellow-400' : 'text-cyan-400' },
            ].map(({ label, value, color = 'text-cyan-400' }) => (
              <div key={label} className="text-center">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {tournament.qualificationRules && (
            <div className="mt-4 pt-4 border-t border-white/6 flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Top teams → Gold</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> Mid teams → Silver</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-700 inline-block" /> Lower teams → Bronze</span>
            </div>
          )}
        </div>

        {/* Status bar: registrations count */}
        {tournament.registrationOpen && (
          <div className="bg-slate-900/40 border border-white/6 rounded-xl px-5 py-3 flex items-center justify-between text-sm">
            <span className="text-slate-400">{tournament.totalRegistrations} teams registered</span>
            {spotsLeft > 0
              ? <span className="text-green-400 font-semibold">{spotsLeft} spots left</span>
              : <span className="text-red-400 font-semibold">Full — waitlist only</span>}
          </div>
        )}

        {/* Feedback messages */}
        {msg   && <div className="bg-cyan-500/10  border border-cyan-500/20  rounded-xl px-4 py-3 text-cyan-400  text-sm">{msg}</div>}
        {error && <div className="bg-red-500/10   border border-red-500/20   rounded-xl px-4 py-3 text-red-400   text-sm">{error}</div>}

        {/* ══ REGISTRATION SECTION ══════════════════════════════════ */}

        {myReg ? (
          /* ── Already registered ─────────────────────────────── */
          <>
            <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cyan-400" strokeWidth={1.75} />
                Your Team
              </h2>
              <div className="space-y-3">
                {/* Team name + status */}
                <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Team Name</p>
                    <p className="font-semibold text-white">{myReg.teamName}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    myReg.status === 'accepted' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                    myReg.status === 'rejected' ? 'text-red-400  bg-red-400/10  border-red-400/20'  :
                    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                  }`}>{myReg.status}</span>
                </div>

                {/* Player 1 */}
                <div className="flex items-center gap-3 bg-slate-800/30 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold">
                    {myReg.player1Name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{myReg.player1Name}</p>
                    <p className="text-xs text-slate-500">Player 1 (you)</p>
                  </div>
                  <Check className="w-4 h-4 text-green-400" />
                </div>

                {/* Player 2 */}
                <div className="flex items-center gap-3 bg-slate-800/30 rounded-xl px-4 py-3">
                  {myReg.partnerStatus === 'confirmed' ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 text-sm font-bold">
                        {myReg.player2Name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{myReg.player2Name}</p>
                        <p className="text-xs text-slate-500">Player 2</p>
                      </div>
                      <Check className="w-4 h-4 text-green-400" />
                    </>
                  ) : myReg.partnerStatus === 'requested' ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-sm font-bold">
                        {myReg.player2Name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{myReg.player2Name}</p>
                        <p className="text-xs text-yellow-500">Invite sent — awaiting confirmation</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                        <UserPlus className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-400">No partner yet</p>
                        <p className="text-xs text-slate-600">Search below to invite a partner</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Partner search */}
            {myReg.partnerStatus !== 'confirmed' && (
              <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <Search className="w-5 h-5 text-cyan-400" strokeWidth={1.75} />
                  {myReg.partnerStatus === 'requested' ? 'Change Partner' : 'Find a Partner'}
                </h2>
                <p className="text-slate-400 text-sm mb-4">Search registered players to invite as your partner</p>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full bg-slate-800/60 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 transition"
                  />
                </div>

                {filtered.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">
                    {search ? 'No players match your search' : 'No other registered players yet'}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {filtered.map((p) => (
                      <div key={p.supabaseId} className="flex items-center justify-between bg-slate-800/40 border border-white/5 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center text-sm font-bold text-white">
                            {p.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{p.name}</p>
                            {p.skillLevel && (
                              <p className={`text-xs ${SKILL_COLOUR[p.skillLevel] ?? 'text-slate-400'}`}>{p.skillLevel}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleInvite(p.supabaseId, p.name)}
                          disabled={inviting === p.supabaseId}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                        >
                          {inviting === p.supabaseId
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Send className="w-3 h-3" />}
                          Invite
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>

        ) : tournament.registrationOpen ? (
          /* ── Register CTA ────────────────────────────────────── */
          <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" strokeWidth={1.75} />
              Register Your Team
            </h2>
            <p className="text-slate-400 text-sm mb-5">
              {loggedIn
                ? "You'll be Player 1. After registering, you can invite a partner."
                : 'Create an account or log in to register. You\'ll land back here automatically.'}
            </p>

            <Button
              onClick={handleRegister}
              disabled={registering || spotsLeft <= 0}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white border-0 py-6 font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {registering
                ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                : loggedIn
                  ? 'Register for Tournament'
                  : '🔑 Log in to Register'}
            </Button>

            {spotsLeft <= 5 && spotsLeft > 0 && (
              <p className="text-center text-yellow-400 text-xs mt-3">Only {spotsLeft} spots remaining!</p>
            )}
          </div>

        ) : (
          /* ── Registration closed ─────────────────────────────── */
          <div className="bg-slate-800/40 border border-white/6 rounded-2xl p-6 text-center text-slate-400">
            <p className="font-medium mb-1">Registration is not open</p>
            <p className="text-sm">
              Status: <span className="text-white">{tournament.championshipStatus?.replace(/_/g, ' ')}</span>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
