'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Feather, ArrowLeft, Trophy, Check, X, Clock, UserPlus, Loader2 } from 'lucide-react';

interface MyReg {
  tournamentId: string;
  tournamentName: string;
  scheduledDate: string;
  championshipStatus: string;
  registrationId: string;
  teamName: string;
  player1Name: string;
  player2Name?: string;
  partnerStatus: 'none' | 'requested' | 'confirmed';
  status: string;
  role?: 'partner';
}

interface PartnerRequest {
  tournamentId: string;
  tournamentName: string;
  scheduledDate: string;
  registrationId: string;
  teamName: string;
  requestedByName: string;
}

const STATUS_COLOUR: Record<string, string> = {
  pending:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  accepted:    'text-green-400 bg-green-400/10 border-green-400/20',
  rejected:    'text-red-400 bg-red-400/10 border-red-400/20',
  waitlisted:  'text-slate-400 bg-slate-400/10 border-slate-400/20',
  withdrawn:   'text-slate-500 bg-slate-500/10 border-slate-500/20',
};

const PARTNER_COLOUR: Record<string, string> = {
  none:      'text-slate-400',
  requested: 'text-yellow-400',
  confirmed: 'text-green-400',
};

export default function MyRegistrationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [myRegistrations, setMyRegistrations] = useState<MyReg[]>([]);
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const res = await fetch('/api/player/registrations');
    if (res.ok) {
      const d = await res.json();
      setMyRegistrations(d.myRegistrations ?? []);
      setPartnerRequests(d.partnerRequests ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/player/login'); return; }
      load();
    });
  }, []);

  const respond = async (req: PartnerRequest, action: 'accept' | 'decline') => {
    setResponding(req.registrationId);
    setMsg('');
    const res = await fetch(`/api/player/registrations/${req.tournamentId}/${req.registrationId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const d = await res.json();
    setMsg(d.message ?? (res.ok ? 'Done!' : d.error ?? 'Error'));
    if (res.ok) await load();
    setResponding(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => router.push('/player/portal')} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Feather className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
          <span className="font-semibold text-sm">My Registrations</span>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-3xl space-y-8">

        {msg && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-3 text-cyan-400 text-sm">{msg}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Partner Requests ──────────────────── */}
            {partnerRequests.length > 0 && (
              <section>
                <h2 className="text-sm uppercase tracking-widest text-yellow-400 font-semibold mb-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Partner Requests
                  <span className="ml-1 bg-yellow-400/20 text-yellow-400 rounded-full px-2 py-0.5 text-xs">{partnerRequests.length}</span>
                </h2>
                <div className="space-y-3">
                  {partnerRequests.map((req) => (
                    <div key={req.registrationId} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white mb-0.5">{req.teamName}</p>
                          <p className="text-sm text-slate-400">
                            <span className="text-yellow-300">{req.requestedByName}</span> wants you to be their partner
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {req.tournamentName} · {new Date(req.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => respond(req, 'accept')}
                            disabled={responding === req.registrationId}
                            className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                          >
                            {responding === req.registrationId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Accept
                          </button>
                          <button
                            onClick={() => respond(req, 'decline')}
                            disabled={responding === req.registrationId}
                            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── My Teams ──────────────────────────── */}
            <section>
              <h2 className="text-sm uppercase tracking-widest text-slate-500 font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> My Teams
              </h2>
              {myRegistrations.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>You haven&apos;t registered for any tournaments yet.</p>
                  <button
                    onClick={() => router.push('/player/tournaments')}
                    className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm transition"
                  >
                    Browse tournaments →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRegistrations.map((reg) => (
                    <div
                      key={reg.registrationId}
                      className="bg-slate-900/60 border border-white/8 rounded-2xl p-5 cursor-pointer hover:border-cyan-500/20 transition"
                      onClick={() => router.push(`/player/tournaments/${reg.tournamentId}`)}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="font-semibold text-white">{reg.teamName}</p>
                          <p className="text-sm text-slate-400 mt-0.5">{reg.tournamentName}</p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {new Date(reg.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOUR[reg.status] ?? STATUS_COLOUR.pending}`}>
                          {reg.status}
                        </span>
                      </div>

                      {/* Players */}
                      <div className="flex gap-3">
                        {/* Player 1 */}
                        <div className="flex items-center gap-2 flex-1 bg-slate-800/40 rounded-xl px-3 py-2">
                          <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
                            {reg.player1Name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white">{reg.player1Name}</p>
                            <p className="text-xs text-slate-600">Player 1{reg.role !== 'partner' ? ' (you)' : ''}</p>
                          </div>
                        </div>

                        {/* Player 2 */}
                        <div className={`flex items-center gap-2 flex-1 rounded-xl px-3 py-2 ${reg.partnerStatus === 'confirmed' ? 'bg-slate-800/40' : 'bg-slate-800/20 border border-dashed border-white/10'}`}>
                          {reg.partnerStatus === 'confirmed' ? (
                            <>
                              <div className="w-7 h-7 rounded-full bg-pink-500/20 flex items-center justify-center text-xs font-bold text-pink-400">
                                {reg.player2Name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-white">{reg.player2Name}</p>
                                <p className="text-xs text-slate-600">Player 2{reg.role === 'partner' ? ' (you)' : ''}</p>
                              </div>
                            </>
                          ) : reg.partnerStatus === 'requested' ? (
                            <>
                              <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-yellow-400">{reg.player2Name}</p>
                                <p className="text-xs text-slate-600">Awaiting response</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 text-slate-600 shrink-0" />
                              <p className="text-xs text-slate-500">No partner yet</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Partner status hint */}
                      {reg.partnerStatus !== 'confirmed' && reg.role !== 'partner' && (
                        <p className="text-xs text-slate-500 mt-3 text-center">
                          {reg.partnerStatus === 'requested'
                            ? `Waiting for ${reg.player2Name} to confirm`
                            : 'Tap to invite a partner'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
