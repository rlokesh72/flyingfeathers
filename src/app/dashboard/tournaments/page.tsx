'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChampionshipBracket from '../components/ChampionshipBracket';

interface Match {
  team1Index: number;
  team2Index: number;
  court: number;
  timeSlot: number;
  team1Score?: number;
  team2Score?: number;
  status: 'scheduled' | 'in-progress' | 'completed';
}

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

interface Registration {
  _id: string;
  teamName: string;
  players: string[];
  contactEmail: string;
  contactPhone?: string;
  status: 'pending' | 'accepted' | 'waitlisted' | 'rejected' | 'withdrawn';
  appliedAt: string;
  reviewedAt?: string;
  notes?: string;
}

interface Group {
  _id: string;
  name: string;
  sequence: number;
  teamIndices: number[];
  standings?: TeamStats[];
}

interface QualificationEntry {
  groupId: string;
  groupName: string;
  rank: number;
  teamIndex: number;
  teamName: string;
  championship: 'gold' | 'silver' | 'bronze';
}

interface BracketMatchData {
  _id: string;
  championship: 'gold' | 'silver' | 'bronze';
  round: string;
  sequence: number;
  team1Index?: number;
  team2Index?: number;
  team1Score?: number;
  team2Score?: number;
  winnerIndex?: number;
  status: 'scheduled' | 'in-progress' | 'completed';
  nextMatchId?: string;
  nextSlot?: 1 | 2;
  matchIndex?: number;
  team1?: { index: number; name: string; players: string[] } | null;
  team2?: { index: number; name: string; players: string[] } | null;
  winner?: { index: number; name: string; players: string[] } | null;
}

interface Tournament {
  _id: string;
  name: string;
  description?: string;
  numberOfTeams: number;
  tournamentFormat: 'court-based' | 'round-robin' | 'championship-groups';
  numberOfCourts?: number;
  roundsPerOpponent?: number;
  maxTeams?: number;
  teamsPerGroup?: number;
  numberOfGroups?: number;
  qualificationRules?: { gold: number[]; silver: number[]; bronze: number[] };
  championshipStatus?: string;
  registrations?: Registration[];
  groups?: Group[];
  qualificationSnapshot?: QualificationEntry[];
  bracketMatches?: BracketMatchData[];
  teams: Array<{
    name: string;
    players: string[];
  }>;
  matches: Match[];
  scheduledDate: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed';
  standings?: TeamStats[];
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

// Toast notification types
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Toast component
function Toast({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgColor = {
    success: 'bg-green-900/90 border-green-600 text-green-100',
    error: 'bg-red-900/90 border-red-600 text-red-100',
    info: 'bg-blue-900/90 border-blue-600 text-blue-100'
  };

  return (
    <div className={`max-w-sm p-4 rounded-lg border ${bgColor[toast.type]} shadow-lg`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium">{toast.message}</p>
        <button
          onClick={() => onClose(toast.id)}
          className="ml-2 text-current hover:opacity-70"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Confirmation Modal component
function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-300 mb-6">{message}</p>
        <div className="flex space-x-3 justify-end">
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Share invite link button ───────────────────────────────────────────── */
function ShareLinkButton({ tournamentId }: { tournamentId: string }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== 'undefined'
    ? `${window.location.origin}/player/tournaments/${tournamentId}`
    : `/player/tournaments/${tournamentId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers that block clipboard without HTTPS
      window.prompt('Copy this registration link:', link);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-200
        ${copied
          ? 'bg-green-500/20 border-green-500/40 text-green-400'
          : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}
    >
      {copied ? '✅ Link Copied!' : '🔗 Copy Invite Link'}
    </button>
  );
}

export default function TournamentsPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormat, setCreateFormat] = useState<'court-based' | 'round-robin' | 'championship-groups' | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showMatches, setShowMatches] = useState(false);
  const [showStandings, setShowStandings] = useState(false);
  const [currentStandings, setCurrentStandings] = useState<TeamStats[]>([]);
  // Championship-groups state
  const [champTab, setChampTab] = useState<'overview' | 'registrations' | 'groups' | 'group-matches' | 'standings' | 'championships'>('overview');
  const [champSubTab, setChampSubTab] = useState<'gold' | 'silver' | 'bronze' | 'overall'>('gold');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [bracketData, setBracketData] = useState<{ gold: BracketMatchData[]; silver: BracketMatchData[]; bronze: BracketMatchData[] }>({ gold: [], silver: [], bronze: [] });
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Toast functions
  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Confirmation modal functions
  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const hideConfirmation = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {}
    });
  };

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData && userData !== 'undefined' && userData !== 'null') {
        const parsedUser = JSON.parse(userData);
        if (parsedUser && parsedUser.id) {
          setAdminUser(parsedUser);
        }
      }
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
    }
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTournament = async (formData: {
    name: string;
    description: string;
    numberOfTeams: number;
    tournamentFormat: 'court-based' | 'round-robin';
    numberOfCourts?: number;
    roundsPerOpponent?: number;
    scheduledDate: string;
  }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setTournaments([data.tournament, ...tournaments]);
        setShowCreateForm(false);
        setSelectedTournament(data.tournament);
        showToast('Tournament created successfully!', 'success');
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to create tournament', 'error');
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      showToast('Failed to create tournament', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateTeam = async (teamIndex: number, teamName: string, players: string[]) => {
    if (!selectedTournament) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${selectedTournament._id}/teams`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teamIndex, teamName, players }),
      });

      if (response.ok) {
        setTournaments(tournaments.map(t =>
          t._id === selectedTournament._id ? { ...t } : t
        ));
        showToast('Team updated successfully!', 'success');
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to update team', 'error');
      }
    } catch (error) {
      console.error('Error updating team:', error);
      showToast('Failed to update team', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    showConfirmation(
      'Delete Tournament',
      'Are you sure you want to delete this tournament? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch(`/api/tournaments/${tournamentId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            showToast('Tournament deleted successfully', 'success');
            setTournaments(tournaments.filter(t => t._id !== tournamentId));
            if (selectedTournament && selectedTournament._id === tournamentId) {
              setSelectedTournament(null);
            }
          } else {
            const data = await response.json();
            const error = data as { error: string };
            showToast(error.error || 'Failed to delete tournament', 'error');
          }
        } catch (error) {
          showToast('Failed to delete tournament', 'error');
        }
        hideConfirmation();
      }
    );
  };

  const confirmTournament = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${selectedTournament._id}/confirm`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const tournamentResponse = await fetch('/api/tournaments', {
          credentials: 'include',
        });
        if (tournamentResponse.ok) {
          const data = await tournamentResponse.json();
          const updatedTournament = data.tournaments.find((t: Tournament) => t._id === selectedTournament._id);
          if (updatedTournament) {
            setSelectedTournament(updatedTournament);
            setTournaments(data.tournaments);
          }
        }
        showToast('Tournament confirmed! You can now start the tournament.', 'success');
      } else {
        const error = await response.json();
        showToast(`Error: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error confirming tournament:', error);
      showToast('Failed to confirm tournament', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startTournament = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${selectedTournament._id}/start`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTournament(data.tournament);
        setTournaments(tournaments.map(t =>
          t._id === data.tournament._id ? data.tournament : t
        ));
        setShowMatches(true);
        setTimeout(() => fetchStandings(), 500);
        showToast(`Tournament started! Generated ${data.totalMatches} matches across ${data.totalTimeSlots} time slots.`, 'success');
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to start tournament', 'error');
      }
    } catch (error) {
      console.error('Error starting tournament:', error);
      showToast('Failed to start tournament', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateMatchScore = async (matchIndex: number, team1Score: number, team2Score: number) => {
    if (!selectedTournament) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${selectedTournament._id}/matches/${matchIndex}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ team1Score, team2Score, status: 'completed' }),
      });

      if (response.ok) {
        const tournamentResponse = await fetch('/api/tournaments', {
          credentials: 'include',
        });
        if (tournamentResponse.ok) {
          const data = await tournamentResponse.json();
          const updatedTournament = data.tournaments.find((t: Tournament) => t._id === selectedTournament._id);
          if (updatedTournament) {
            setSelectedTournament(updatedTournament);
            setTournaments(data.tournaments);
          }
        }
        fetchStandings();
        // Refresh group standings after any score update (championship-groups)
        if (selectedTournament.tournamentFormat === 'championship-groups') {
          fetchGroups(selectedTournament._id);
        }
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to update match score', 'error');
      }
    } catch (error) {
      console.error('Error updating match score:', error);
      showToast('Failed to update match score', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStandings = async () => {
    if (!selectedTournament) return;

    try {
      const response = await fetch(`/api/tournaments/${selectedTournament._id}/standings`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentStandings(data.standings);
      }
    } catch (error) {
      console.error('Error fetching standings:', error);
    }
  };

  // ── Championship-groups API helpers ──────────────────────────────────────

  const createChampionshipTournament = async (data: {
    name: string;
    description: string;
    scheduledDate: string;
    maxTeams: number;
    teamsPerGroup: number;
    qualificationRules: { gold: number[]; silver: number[]; bronze: number[] };
    numberOfCourts?: number;
  }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, tournamentFormat: 'championship-groups' }),
      });
      if (response.ok) {
        const result = await response.json();
        setTournaments([result.tournament, ...tournaments]);
        setShowCreateForm(false);
        setCreateFormat(null);
        setSelectedTournament(result.tournament);
        setChampTab('overview');
        showToast('Championship tournament created!', 'success');
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to create tournament', 'error');
      }
    } catch {
      showToast('Failed to create tournament', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (tournamentId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/registrations`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations);
      }
    } catch { /* ignore */ }
  };

  const fetchGroups = async (tournamentId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/groups`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups);
      }
    } catch { /* ignore */ }
  };

  const fetchBrackets = async (tournamentId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/championships`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBracketData({ gold: data.gold ?? [], silver: data.silver ?? [], bronze: data.bronze ?? [] });
      }
    } catch { /* ignore */ }
  };

  const updateRegistrationStatus = async (regId: string, status: string) => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament._id}/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchRegistrations(selectedTournament._id);
        showToast(`Registration ${status}`, 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update', 'error');
      }
    } catch { showToast('Error updating registration', 'error'); }
    finally { setLoading(false); }
  };

  const openRegistration = async () => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament._id}/open-registration`, {
        method: 'POST', credentials: 'include',
      });
      if (res.ok) {
        await refreshSelectedTournament();
        showToast('Registration opened!', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to open registration', 'error');
      }
    } catch { showToast('Error', 'error'); }
    finally { setLoading(false); }
  };

  const closeRegistration = async () => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament._id}/close-registration`, {
        method: 'POST', credentials: 'include',
      });
      if (res.ok) {
        await refreshSelectedTournament();
        showToast('Registration closed! Teams created from accepted registrations.', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to close registration', 'error');
      }
    } catch { showToast('Error', 'error'); }
    finally { setLoading(false); }
  };

  const generateGroupsAction = async () => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament._id}/groups/generate`, {
        method: 'POST', credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        await refreshSelectedTournament();
        await fetchGroups(selectedTournament._id);
        showToast(`Groups generated! ${data.matchesAdded} matches created.`, 'success');
        setChampTab('groups');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to generate groups', 'error');
      }
    } catch { showToast('Error', 'error'); }
    finally { setLoading(false); }
  };

  const confirmGroupStageAction = async () => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament._id}/group-stage/confirm`, {
        method: 'POST', credentials: 'include',
      });
      if (res.ok) {
        await refreshSelectedTournament();
        showToast('Group stage confirmed! Qualification snapshot saved.', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to confirm group stage', 'error');
      }
    } catch { showToast('Error', 'error'); }
    finally { setLoading(false); }
  };

  const generateChampionshipsAction = async () => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament._id}/championships/generate`, {
        method: 'POST', credentials: 'include',
      });
      if (res.ok) {
        await refreshSelectedTournament();
        await fetchBrackets(selectedTournament._id);
        showToast('Championship brackets generated!', 'success');
        setChampTab('championships');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to generate brackets', 'error');
      }
    } catch { showToast('Error', 'error'); }
    finally { setLoading(false); }
  };

  const refreshSelectedTournament = async () => {
    try {
      const res = await fetch('/api/tournaments', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTournaments(data.tournaments);
        if (selectedTournament) {
          const updated = data.tournaments.find((t: Tournament) => t._id === selectedTournament._id);
          if (updated) setSelectedTournament(updated);
        }
      }
    } catch { /* ignore */ }
  };

  const completeTournament = async () => {
    if (!selectedTournament) return;

    showConfirmation(
      'Complete Tournament',
      'Are you sure you want to complete this tournament? This action cannot be undone.',
      async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/tournaments/${selectedTournament._id}/complete`, {
            method: 'POST',
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            const completedTournament = data.tournament;
            const finalStandings = data.standings;

            setSelectedTournament(completedTournament);
            setTournaments(tournaments.map(t =>
              t._id === selectedTournament._id ? completedTournament : t
            ));
            setCurrentStandings(finalStandings);
            setShowStandings(true);
            setShowMatches(false);

            showToast('Tournament completed! Viewing final standings.', 'success');
          } else {
            const data = await response.json();
            const error = data as { error: string };
            showToast(`Error: ${error.error}`, 'error');
          }
        } catch (error) {
          showToast('Failed to complete tournament', 'error');
        }
        setLoading(false);
        hideConfirmation();
      }
    );
  };

  // Create Tournament Form Component
  const CreateTournamentForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      numberOfTeams: 4,
      tournamentFormat: 'court-based' as 'court-based' | 'round-robin',
      numberOfCourts: 2,
      roundsPerOpponent: 2,
      scheduledDate: '',
    });

    useEffect(() => {
      if (showCreateForm && !formData.scheduledDate) {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        const localDateTime = now.toISOString().slice(0, 16);
        setFormData(prev => ({ ...prev, scheduledDate: localDateTime }));
      }
    }, [showCreateForm, formData.scheduledDate]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createTournament(formData);
    };

    return (
      <Card className="max-w-md mx-auto bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-cyan-400">Create New Tournament</CardTitle>
          <CardDescription className="text-slate-300">
            Set up a new badminton tournament
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tournament Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="e.g., Spring Championship 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="Tournament details..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tournament Format
              </label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, tournamentFormat: 'court-based'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.tournamentFormat === 'court-based'
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                      : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="text-lg font-bold mb-1">🏸 Court-Based</div>
                  <div className="text-xs">With court allocation</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, tournamentFormat: 'round-robin'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.tournamentFormat === 'round-robin'
                      ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                      : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="text-lg font-bold mb-1">🔄 Round-Robin</div>
                  <div className="text-xs">Multiple rounds</div>
                </button>
              </div>
              {/* Championship Groups — opens separate wizard */}
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); setCreateFormat('championship-groups'); }}
                className="w-full p-4 rounded-lg border-2 transition-all border-amber-500/50 bg-amber-500/10 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20"
              >
                <div className="text-lg font-bold mb-1">🏆 Championship Groups</div>
                <div className="text-xs text-amber-300">Group stage → Gold / Silver / Bronze knockouts</div>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Number of Teams
              </label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({...formData, numberOfTeams: Math.max(2, formData.numberOfTeams - 1)})}
                  disabled={formData.numberOfTeams <= 2}
                  className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white"
                >
                  -
                </Button>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-white">{formData.numberOfTeams}</div>
                  <div className="text-sm text-slate-400">Teams</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({...formData, numberOfTeams: Math.min(12, formData.numberOfTeams + 1)})}
                  disabled={formData.numberOfTeams >= 12}
                  className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white"
                >
                  +
                </Button>
              </div>
            </div>

            {formData.tournamentFormat === 'court-based' ? (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Number of Courts
                </label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({...formData, numberOfCourts: Math.max(1, formData.numberOfCourts - 1)})}
                    disabled={formData.numberOfCourts <= 1}
                    className="border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-white"
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-white">{formData.numberOfCourts}</div>
                    <div className="text-sm text-slate-400">Courts</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({...formData, numberOfCourts: Math.min(10, formData.numberOfCourts + 1)})}
                    disabled={formData.numberOfCourts >= 10}
                    className="border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-white"
                  >
                    +
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rounds Per Opponent
                </label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({...formData, roundsPerOpponent: Math.max(1, formData.roundsPerOpponent - 1)})}
                    disabled={formData.roundsPerOpponent <= 1}
                    className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-white">{formData.roundsPerOpponent}</div>
                    <div className="text-sm text-slate-400">Rounds</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({...formData, roundsPerOpponent: Math.min(5, formData.roundsPerOpponent + 1)})}
                    disabled={formData.roundsPerOpponent >= 5}
                    className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                  >
                    +
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Each team will play every other team {formData.roundsPerOpponent} time{formData.roundsPerOpponent > 1 ? 's' : ''}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Scheduled Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                required
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white [color-scheme:dark]"
                title="Select tournament date and time"
              />
              <p className="text-xs text-slate-400 mt-1">
                Select when the tournament will take place
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0"
              >
                {loading ? 'Creating...' : 'Create Tournament'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  // ── Championship Groups Creation Wizard ────────────────────────────────
  const CreateChampionshipWizard = () => {
    const [step, setStep] = useState(1);
    const TOTAL_STEPS = 6;
    const [wData, setWData] = useState({
      name: '',
      description: '',
      scheduledDate: (() => {
        const d = new Date();
        d.setHours(d.getHours() + 1, 0, 0, 0);
        return d.toISOString().slice(0, 16);
      })(),
      maxTeams: 32,
      teamsPerGroup: 4,
      qualificationRules: { gold: [1], silver: [2, 3], bronze: [4] },
      numberOfCourts: 4,
    });

    const numberOfGroups = wData.teamsPerGroup > 0 ? Math.floor(wData.maxTeams / wData.teamsPerGroup) : 0;
    const goldCount = wData.qualificationRules.gold.length * numberOfGroups;
    const silverCount = wData.qualificationRules.silver.length * numberOfGroups;
    const bronzeCount = wData.qualificationRules.bronze.length * numberOfGroups;

    const roundsLabel = (n: number) => {
      if (n <= 2) return ['Final'];
      if (n <= 4) return ['Semi-Final', 'Final'];
      if (n <= 8) return ['Quarter-Final', 'Semi-Final', 'Final'];
      if (n <= 16) return ['R16', 'QF', 'SF', 'Final'];
      return ['R32', 'R16', 'QF', 'SF', 'Final'];
    };

    const handleSubmit = () => {
      createChampionshipTournament(wData);
    };

    const stepTitles = ['Tournament Details', 'Registration', 'Group Structure', 'Championship Structure', 'Courts & Scheduling', 'Review'];

    return (
      <Card className="max-w-2xl mx-auto bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-amber-400">🏆 Create Championship Groups Tournament</CardTitle>
          <CardDescription className="text-slate-300">
            Step {step} of {TOTAL_STEPS}: {stepTitles[step - 1]}
          </CardDescription>
          <div className="flex gap-1 mt-3">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i + 1 <= step ? 'bg-amber-500' : 'bg-slate-600'}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Step 1: Tournament Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tournament Name *</label>
                <input
                  type="text"
                  value={wData.name}
                  onChange={e => setWData({ ...wData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="e.g., Flying Feathers Open 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                <textarea
                  value={wData.description}
                  onChange={e => setWData({ ...wData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  rows={3}
                  placeholder="Tournament details, venue, rules..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Scheduled Date &amp; Time *</label>
                <input
                  type="datetime-local"
                  value={wData.scheduledDate}
                  onChange={e => setWData({ ...wData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white [color-scheme:dark]"
                />
              </div>
            </div>
          )}

          {/* Step 2: Registration */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Maximum Teams</label>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setWData({ ...wData, maxTeams: Math.max(4, wData.maxTeams - (wData.teamsPerGroup || 4)) })}
                    className="border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-white">−</Button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-white">{wData.maxTeams}</div>
                    <div className="text-sm text-slate-400">Teams max</div>
                  </div>
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setWData({ ...wData, maxTeams: Math.min(256, wData.maxTeams + (wData.teamsPerGroup || 4)) })}
                    className="border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-white">+</Button>
                </div>
                <p className="text-xs text-slate-400 mt-2">Teams register separately — registration opens/closes via the admin panel</p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                <div className="text-amber-400 font-semibold mb-1">📋 How Registration Works</div>
                <ul className="space-y-1 text-slate-400 text-xs">
                  <li>1. Open registration from the Registrations tab</li>
                  <li>2. Teams submit their info (name, players, contact)</li>
                  <li>3. You Accept / Waitlist / Reject each registration</li>
                  <li>4. Close registration to lock teams and create groups</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Group Structure */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Teams per Group</label>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setWData({ ...wData, teamsPerGroup: Math.max(2, wData.teamsPerGroup - 1) })}
                    className="border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-white">−</Button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-white">{wData.teamsPerGroup}</div>
                    <div className="text-sm text-slate-400">per group</div>
                  </div>
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setWData({ ...wData, teamsPerGroup: Math.min(8, wData.teamsPerGroup + 1) })}
                    className="border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-white">+</Button>
                </div>
              </div>

              {wData.maxTeams % wData.teamsPerGroup === 0 ? (
                <div className="p-4 bg-green-900/20 border border-green-700/40 rounded-lg">
                  <div className="text-green-400 font-semibold text-lg">{numberOfGroups} Groups will be created</div>
                  <div className="text-green-300 text-sm">{wData.maxTeams} teams ÷ {wData.teamsPerGroup} per group</div>
                </div>
              ) : (
                <div className="p-3 bg-red-900/20 border border-red-700/40 rounded-lg text-red-400 text-sm">
                  ⚠️ {wData.maxTeams} is not divisible by {wData.teamsPerGroup}. Adjust maxTeams or teams per group.
                </div>
              )}

              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="text-slate-300 font-semibold mb-2">Default Qualification Path</div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-bold">1st</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-yellow-300">🥇 Gold ({numberOfGroups} teams)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-bold">2nd + 3rd</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-200">🥈 Silver ({numberOfGroups * 2} teams)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 font-bold">4th</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-orange-300">🥉 Bronze ({numberOfGroups} teams)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Championship Structure */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-slate-300 text-sm mb-2">Based on your group configuration, here are the knockout paths:</div>

              {[
                { label: '🥇 Gold', count: goldCount, color: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/40' },
                { label: '🥈 Silver', count: silverCount, color: 'text-slate-300 bg-slate-700/40 border-slate-600/40' },
                { label: '🥉 Bronze', count: bronzeCount, color: 'text-orange-400 bg-orange-900/20 border-orange-700/40' },
              ].map(({ label, count, color }) => (
                <div key={label} className={`p-4 rounded-lg border ${color}`}>
                  <div className="font-semibold">{label}: {count} teams</div>
                  <div className="text-sm mt-1 text-slate-400">
                    {roundsLabel(count).join(' → ')}
                    {count > 0 && ` (${count - 1} matches total)`}
                  </div>
                </div>
              ))}

              {(goldCount === 0 || silverCount === 0 || bronzeCount === 0) && (
                <div className="text-amber-400 text-sm">⚠️ Go back to Step 3 and ensure maxTeams is divisible by teamsPerGroup</div>
              )}
            </div>
          )}

          {/* Step 5: Courts & Scheduling */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Number of Courts (Optional)</label>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setWData({ ...wData, numberOfCourts: Math.max(1, wData.numberOfCourts - 1) })}
                    className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white">−</Button>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-white">{wData.numberOfCourts}</div>
                    <div className="text-sm text-slate-400">Courts</div>
                  </div>
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setWData({ ...wData, numberOfCourts: Math.min(20, wData.numberOfCourts + 1) })}
                    className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white">+</Button>
                </div>
                <p className="text-xs text-slate-400 mt-2">Used for court assignment during the group and knockout stages</p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg text-xs text-slate-400">
                <div className="text-slate-300 font-semibold mb-1">📅 Scheduling</div>
                Group matches are generated automatically when you generate groups from the admin panel.
                Knockout matches are generated after you confirm the group stage standings.
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-3">
              <div className="font-mono text-xs text-slate-300 bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-1 leading-relaxed">
                <div className="text-amber-400 font-bold text-sm mb-2">📋 Tournament Summary</div>
                <div>Name: <span className="text-white">{wData.name || '(unnamed)'}</span></div>
                <div>Date: <span className="text-white">{wData.scheduledDate ? new Date(wData.scheduledDate).toLocaleString() : '—'}</span></div>
                <div className="mt-2 text-amber-400">━━ Group Stage ━━━━━━━━━━━━━━</div>
                <div>Max Teams:    <span className="text-white">{wData.maxTeams}</span></div>
                <div>Teams/Group:  <span className="text-white">{wData.teamsPerGroup}</span></div>
                <div>Groups:       <span className="text-white">{numberOfGroups}</span></div>
                <div>Group Matches:<span className="text-white"> {numberOfGroups * (wData.teamsPerGroup * (wData.teamsPerGroup - 1) / 2)}</span></div>
                <div className="mt-2 text-yellow-400">━━ Gold  ({goldCount} teams) ━━━━━━━━━━</div>
                <div className="text-slate-400">{roundsLabel(goldCount).join(' → ')}</div>
                <div className="text-slate-500">({goldCount - 1} matches)</div>
                <div className="mt-1 text-slate-300">━━ Silver ({silverCount} teams) ━━━━━━━━</div>
                <div className="text-slate-400">{roundsLabel(silverCount).join(' → ')}</div>
                <div className="text-slate-500">({silverCount - 1} matches)</div>
                <div className="mt-1 text-orange-400">━━ Bronze ({bronzeCount} teams) ━━━━━━━━</div>
                <div className="text-slate-400">{roundsLabel(bronzeCount).join(' → ')}</div>
                <div className="text-slate-500">({bronzeCount - 1} matches)</div>
                <div className="mt-2 text-cyan-400">Total knockout matches: {goldCount - 1 + silverCount - 1 + bronzeCount - 1}</div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => step === 1 ? setCreateFormat(null) : setStep(step - 1)}
              className="border-slate-600 text-slate-300"
            >
              {step === 1 ? 'Cancel' : '← Back'}
            </Button>
            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                disabled={step === 1 && !wData.name}
                onClick={() => setStep(step + 1)}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0"
              >
                Next →
              </Button>
            ) : (
              <Button
                type="button"
                disabled={loading || !wData.name || wData.maxTeams % wData.teamsPerGroup !== 0}
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0"
              >
                {loading ? 'Creating…' : '🏆 Create Tournament'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Team Management Component
  const TeamManagement = ({ tournament }: { tournament: Tournament }) => {
    const [editingTeam, setEditingTeam] = useState<number | null>(null);
    const [teamData, setTeamData] = useState({ name: '', players: [''] });

    const startEditing = (teamIndex: number) => {
      const team = tournament.teams[teamIndex];
      const players = [...team.players];
      while (players.length < 2) players.push('');
      if (players.length > 2) players.splice(2);

      setTeamData({
        name: team.name,
        players: players
      });
      setEditingTeam(teamIndex);
    };

    const saveTeam = () => {
      if (editingTeam !== null) {
        updateTeam(editingTeam, teamData.name, teamData.players);
        setEditingTeam(null);
      }
    };

    const updatePlayer = (index: number, value: string) => {
      const newPlayers = [...teamData.players];
      newPlayers[index] = value;
      setTeamData({
        ...teamData,
        players: newPlayers
      });
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tournament.teams.map((team, index) => (
          <Card key={index} className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400 text-lg">
                {editingTeam === index ? (
                  <input
                    type="text"
                    value={teamData.name}
                    onChange={(e) => setTeamData({...teamData, name: e.target.value})}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                ) : (
                  team.name
                )}
              </CardTitle>
              <CardDescription className="text-slate-400">
                2 players max
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingTeam === index ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-400">Player 1</label>
                    <input
                      type="text"
                      value={teamData.players[0] || ''}
                      onChange={(e) => updatePlayer(0, e.target.value)}
                      placeholder="First player name"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-400">Player 2</label>
                    <input
                      type="text"
                      value={teamData.players[1] || ''}
                      onChange={(e) => updatePlayer(1, e.target.value)}
                      placeholder="Second player name"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={saveTeam}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingTeam(null)}
                      className="border-slate-600 text-slate-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="text-slate-300 text-sm">
                      <span className="text-slate-400">Player 1:</span> {team.players[0] || 'Not assigned'}
                    </div>
                    <div className="text-slate-300 text-sm">
                      <span className="text-slate-400">Player 2:</span> {team.players[1] || 'Not assigned'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEditing(index)}
                    className="w-full mt-3 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white"
                  >
                    Edit Team
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Standings Component
  const StandingsTable = ({ standings, tournament }: { standings: TeamStats[], tournament: Tournament }) => {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-cyan-400 text-center">
              {tournament.status === 'completed' ? 'Final Standings' : 'Current Standings'}
            </CardTitle>
            <CardDescription className="text-slate-300 text-center">
              {tournament.status === 'completed'
                ? 'Tournament completed - Final results'
                : 'Live standings updated after each match'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-3 px-2 text-cyan-400">Rank</th>
                    <th className="text-left py-3 px-2 text-cyan-400">Team</th>
                    <th className="text-left py-3 px-2 text-cyan-400">Players</th>
                    <th className="text-center py-3 px-2 text-cyan-400">MP</th>
                    <th className="text-center py-3 px-2 text-cyan-400">W</th>
                    <th className="text-center py-3 px-2 text-cyan-400">L</th>
                    <th className="text-center py-3 px-2 text-cyan-400">PF</th>
                    <th className="text-center py-3 px-2 text-cyan-400">PA</th>
                    <th className="text-center py-3 px-2 text-cyan-400">+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, index) => (
                    <tr
                      key={team.teamIndex}
                      className={`border-b border-slate-700 ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-900/20 to-yellow-800/20' :
                        index === 1 ? 'bg-gradient-to-r from-slate-700/20 to-slate-600/20' :
                        index === 2 ? 'bg-gradient-to-r from-orange-900/20 to-orange-800/20' :
                        'hover:bg-slate-700/50'
                      }`}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className={`
                            font-bold text-lg
                            ${index === 0 ? 'text-yellow-400' :
                              index === 1 ? 'text-slate-300' :
                              index === 2 ? 'text-orange-400' :
                              'text-slate-400'}
                          `}>
                            {index + 1}
                          </span>
                          {index === 0 && <span className="text-yellow-400">🥇</span>}
                          {index === 1 && <span className="text-slate-300">🥈</span>}
                          {index === 2 && <span className="text-orange-400">🥉</span>}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-white">{team.teamName}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="text-slate-300 text-xs">
                          {team.players.filter(p => p.trim()).join(', ') || 'No players assigned'}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-slate-300">{team.matchesPlayed}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-green-400 font-bold">{team.wins}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-red-400 font-bold">{team.losses}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-blue-400">{team.pointsFor}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-purple-400">{team.pointsAgainst}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-bold ${
                          team.pointDifference > 0 ? 'text-green-400' :
                          team.pointDifference < 0 ? 'text-red-400' :
                          'text-slate-400'
                        }`}>
                          {team.pointDifference > 0 ? '+' : ''}{team.pointDifference}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-slate-400 text-center">
              MP = Matches Played | W = Wins | L = Losses | PF = Points For | PA = Points Against | +/- = Point Difference
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ── OverallStandings: full tournament leaderboard across all 3 championships ──
  const OverallStandings = ({ bracketData, teams }: {
    bracketData: { gold: BracketMatchData[]; silver: BracketMatchData[]; bronze: BracketMatchData[] };
    teams: Array<{ name: string; players: string[] }>;
  }) => {
    type Placement = { place: number; tier: string; tierLabel: string; team: string; players: string; badge: string };

    function getPlacementsForTier(
      matches: BracketMatchData[],
      tierLabel: string,
      basePlace: number,
    ): Placement[] {
      const resolve = (idx?: number, obj?: any) =>
        obj ?? (idx !== undefined && idx >= 0 ? teams[idx] ?? null : null);

      const results: Placement[] = [];
      const badges: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' };
      const tier = tierLabel as 'gold' | 'silver' | 'bronze';

      const finalM  = matches.find(m => m.round === 'final');
      const semiMs  = matches.filter(m => m.round === 'semi_final');

      if (finalM?.status === 'completed') {
        const winner = resolve(finalM.winnerIndex, (finalM as any).winner);
        const loserIdx = finalM.winnerIndex === finalM.team1Index ? finalM.team2Index : finalM.team1Index;
        const loserObj = finalM.winnerIndex === finalM.team1Index ? (finalM as any).team2 : (finalM as any).team1;
        const loser = resolve(loserIdx, loserObj);
        if (winner) results.push({ place: basePlace,     tier, tierLabel, team: winner.name, players: winner.players?.join(' & ') ?? '', badge: badges[tier] });
        if (loser)  results.push({ place: basePlace + 1, tier, tierLabel, team: loser.name,  players: loser.players?.join(' & ') ?? '',  badge: '🎖️' });
      }

      semiMs.forEach(m => {
        if (m.status !== 'completed') return;
        const loserIdx = m.winnerIndex === m.team1Index ? m.team2Index : m.team1Index;
        const loserObj = m.winnerIndex === m.team1Index ? (m as any).team2 : (m as any).team1;
        const loser = resolve(loserIdx, loserObj);
        if (loser) results.push({ place: basePlace + 2, tier, tierLabel, team: loser.name, players: loser.players?.join(' & ') ?? '', badge: '' });
      });

      return results;
    }

    const all: Placement[] = [
      ...getPlacementsForTier(bracketData.gold,   'gold',   1),
      ...getPlacementsForTier(bracketData.silver, 'silver', bracketData.gold.length > 0 ? 5 : 1),
      ...getPlacementsForTier(bracketData.bronze, 'bronze', bracketData.gold.length > 0 ? 9 : 1),
    ];

    const tierColor: Record<string, string> = {
      gold:   'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
      silver: 'text-slate-300 bg-slate-700/30 border-slate-500/30',
      bronze: 'text-orange-400 bg-orange-900/20 border-orange-500/30',
    };

    return (
      <div className="space-y-3">
        <div className="text-slate-400 text-sm font-semibold mb-2">📊 Overall Tournament Standings</div>
        {all.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">Log championship match results to see standings here.</div>
        ) : (
          <div className="space-y-2">
            {all.map((p, i) => (
              <div key={i} className={`flex items-center gap-4 rounded-xl px-4 py-3 border ${tierColor[p.tier]}`}>
                <div className="flex items-center gap-2 w-8 shrink-0">
                  <span className="text-slate-500 text-sm font-bold">{p.place}</span>
                  {p.badge && <span className="text-base">{p.badge}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{p.team}</p>
                  <p className="text-xs text-slate-500 truncate">{p.players}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${tierColor[p.tier]}`}>
                  {p.tierLabel}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── GroupMatchesPanel: inline score editing for championship-groups ──────
  const GroupMatchesPanel = ({
    tournament, groups, onSave,
  }: { tournament: Tournament; groups: Group[]; onSave: (idx: number, s1: number, s2: number) => void }) => {
    const [editing, setEditing] = useState<number | null>(null);
    const [scores, setScores] = useState({ s1: 0, s2: 0 });

    const startEdit = (matchIndex: number, match: any) => {
      setEditing(matchIndex);
      setScores({ s1: match.team1Score ?? 0, s2: match.team2Score ?? 0 });
    };

    const clamp = (v: string) => Math.min(30, Math.max(0, parseInt(v.replace(/\D/g, '') || '0', 10)));

    if (groups.length === 0) {
      return <div className="text-center text-slate-400 py-8">Generate groups first, then come back here to log scores.</div>;
    }

    return (
      <div className="space-y-6">
        {groups.map((group) => {
          const gMatches = tournament.matches
            .map((m: any, i: number) => ({ ...m, index: i }))
            .filter((m: any) => m.phase === 'group' && m.groupIndex === group.sequence);

          const done  = gMatches.filter((m: any) => m.status === 'completed').length;
          const total = gMatches.length;

          return (
            <div key={group._id}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-amber-400 font-semibold text-base">{group.name}</h3>
                <span className="text-xs text-slate-400">{done}/{total} completed</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {gMatches.map((match: any) => {
                  const t1 = tournament.teams[match.team1Index]?.name ?? 'TBD';
                  const t2 = tournament.teams[match.team2Index]?.name ?? 'TBD';
                  const isEditing = editing === match.index;
                  const isDone = match.status === 'completed';

                  return (
                    <Card key={match.index} className={`border transition-colors ${isDone ? 'bg-green-900/10 border-green-700/40' : isEditing ? 'bg-cyan-900/10 border-cyan-500/50' : 'bg-slate-800 border-slate-700'}`}>
                      <CardContent className="py-3 px-4 space-y-2">
                        <div className="text-xs text-slate-500">Match #{match.index + 1}</div>

                        {/* Score display / edit row */}
                        <div className="flex items-center gap-2">
                          {/* Team 1 */}
                          <div className="flex-1 text-right">
                            <p className="text-sm font-semibold text-white truncate">{t1}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {tournament.teams[match.team1Index]?.players?.join(' & ') ?? ''}
                            </p>
                            {isEditing ? (
                              <input
                                type="number" min={0} max={30}
                                value={scores.s1}
                                onChange={(e) => setScores(s => ({ ...s, s1: clamp(e.target.value) }))}
                                className="w-full mt-1 px-2 py-1.5 text-center text-lg font-bold bg-slate-700 border-2 border-cyan-500 rounded-lg text-white focus:outline-none"
                              />
                            ) : (
                              <p className={`text-xl font-bold text-right mt-1 ${isDone ? (match.team1Score > match.team2Score ? 'text-green-400' : 'text-slate-400') : 'text-slate-500'}`}>
                                {isDone ? match.team1Score : '—'}
                              </p>
                            )}
                          </div>

                          {/* Divider */}
                          <div className={`text-sm font-bold px-1 self-center ${isEditing ? 'text-cyan-400' : isDone ? 'text-slate-400' : 'text-slate-600'}`}>vs</div>

                          {/* Team 2 */}
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold text-white truncate">{t2}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {tournament.teams[match.team2Index]?.players?.join(' & ') ?? ''}
                            </p>
                            {isEditing ? (
                              <input
                                type="number" min={0} max={30}
                                value={scores.s2}
                                onChange={(e) => setScores(s => ({ ...s, s2: clamp(e.target.value) }))}
                                className="w-full mt-1 px-2 py-1.5 text-center text-lg font-bold bg-slate-700 border-2 border-cyan-500 rounded-lg text-white focus:outline-none"
                              />
                            ) : (
                              <p className={`text-xl font-bold mt-1 ${isDone ? (match.team2Score > match.team1Score ? 'text-green-400' : 'text-slate-400') : 'text-slate-500'}`}>
                                {isDone ? match.team2Score : '—'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        {isEditing ? (
                          <div className="flex gap-2 pt-1">
                            <Button size="sm"
                              onClick={() => { onSave(match.index, scores.s1, scores.s2); setEditing(null); }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0 text-xs h-7">
                              ✓ Save
                            </Button>
                            <Button size="sm" variant="outline"
                              onClick={() => setEditing(null)}
                              className="flex-1 border-slate-600 text-slate-400 text-xs h-7">
                              Cancel
                            </Button>
                          </div>
                        ) : isDone ? (
                          <button
                            onClick={() => startEdit(match.index, match)}
                            className="w-full text-xs text-slate-500 hover:text-cyan-400 transition pt-1 text-center">
                            ✓ Completed · Edit
                          </button>
                        ) : (
                          <Button size="sm"
                            onClick={() => startEdit(match.index, match)}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white border-0 text-xs h-7 mt-1">
                            Log Score
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Match Schedule Component
  const MatchSchedule = ({ tournament }: { tournament: Tournament }) => {
    const [editingMatch, setEditingMatch] = useState<number | null>(null);
    const [scoreData, setScoreData] = useState({ team1Score: 0, team2Score: 0 });

    const handleScoreInput = (value: string, scoreType: 'team1Score' | 'team2Score') => {
      let cleanValue = value.replace(/[^0-9]/g, '');

      if (cleanValue === '') {
        cleanValue = '0';
      }

      if (cleanValue.length > 1 && cleanValue.startsWith('0')) {
        cleanValue = cleanValue.replace(/^0+/, '');
        if (cleanValue === '') {
          cleanValue = '0';
        }
      }

      const numValue = parseInt(cleanValue, 10);
      if (numValue > 30) {
        cleanValue = '30';
      }

      setScoreData(prev => ({
        ...prev,
        [scoreType]: parseInt(cleanValue, 10)
      }));
    };

    const startScoreEdit = (matchIndex: number, match: Match) => {
      setEditingMatch(matchIndex);
      setScoreData({
        team1Score: match.team1Score || 0,
        team2Score: match.team2Score || 0,
      });
    };

    const saveScore = (matchIndex: number) => {
      updateMatchScore(matchIndex, scoreData.team1Score, scoreData.team2Score);
      setEditingMatch(null);
    };

    const timeSlots: { [key: number]: (Match & { index: number })[] } = {};
    tournament.matches.forEach((match, index) => {
      if (!timeSlots[match.timeSlot]) {
        timeSlots[match.timeSlot] = [];
      }
      timeSlots[match.timeSlot].push({ ...match, index });
    });

    return (
      <div className="space-y-6">
        {Object.keys(timeSlots).map((timeSlot) => (
          <Card key={timeSlot} className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">Time Slot {timeSlot}</CardTitle>
              <CardDescription className="text-slate-300">
                {timeSlots[parseInt(timeSlot)].length} matches scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timeSlots[parseInt(timeSlot)].map((match: any) => (
                  <Card key={match.index} className="bg-slate-700 border-slate-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-pink-400">
                        {match.court ? `Court ${match.court}` : `Match ${match.index + 1}`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="text-slate-300">
                            <div className="font-medium">{tournament.teams[match.team1Index]?.name}</div>
                            <div className="text-sm text-slate-400">
                              {tournament.teams[match.team1Index]?.players.join(', ')}
                            </div>
                          </div>
                          {editingMatch === match.index ? (
                            <input
                              type="text"
                              value={scoreData.team1Score}
                              onChange={(e) => handleScoreInput(e.target.value, 'team1Score')}
                              onInput={(e) => handleScoreInput((e.target as HTMLInputElement).value, 'team1Score')}
                              className="w-20 px-3 py-2 bg-slate-600 border-2 border-cyan-500 rounded-md text-white text-center text-lg font-semibold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                              min="0"
                              max="30"
                              placeholder="0"
                              autoFocus
                              inputMode="numeric"
                              pattern="[0-9]*"
                            />
                          ) : (
                            <div className="text-2xl font-bold text-cyan-400">
                              {match.team1Score !== undefined ? match.team1Score : '-'}
                            </div>
                          )}
                        </div>

                        <div className="text-center text-slate-500 font-bold">VS</div>

                        <div className="flex justify-between items-center">
                          <div className="text-slate-300">
                            <div className="font-medium">{tournament.teams[match.team2Index]?.name}</div>
                            <div className="text-sm text-slate-400">
                              {tournament.teams[match.team2Index]?.players.join(', ')}
                            </div>
                          </div>
                          {editingMatch === match.index ? (
                            <input
                              type="text"
                              value={scoreData.team2Score}
                              onChange={(e) => handleScoreInput(e.target.value, 'team2Score')}
                              onInput={(e) => handleScoreInput((e.target as HTMLInputElement).value, 'team2Score')}
                              className="w-20 px-3 py-2 bg-slate-600 border-2 border-pink-500 rounded-md text-white text-center text-lg font-semibold focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                              min="0"
                              max="30"
                              placeholder="0"
                              inputMode="numeric"
                              pattern="[0-9]*"
                            />
                          ) : (
                            <div className="text-2xl font-bold text-pink-400">
                              {match.team2Score !== undefined ? match.team2Score : '-'}
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          {editingMatch === match.index ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveScore(match.index)}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingMatch(null)}
                                className="border-slate-600 text-slate-300"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startScoreEdit(match.index, match)}
                              className={`w-full ${
                                match.team1Score !== undefined && match.team2Score !== undefined
                                  ? 'border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black'
                                  : 'border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white'
                              }`}
                            >
                              {match.team1Score !== undefined && match.team2Score !== undefined
                                ? 'Edit Score'
                                : 'Log Score'
                              }
                            </Button>
                          )}
                        </div>

                        {match.team1Score !== undefined && match.team2Score !== undefined && (
                          <div className="text-center text-sm text-slate-400">
                            Point Difference: {Math.abs(match.team1Score - match.team2Score)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // ── Championship Management Component ──────────────────────────────────
  const ChampionshipManagement = ({ tournament }: { tournament: Tournament }) => {
    const cs = tournament.championshipStatus ?? 'draft';

    const statusLabel: Record<string, string> = {
      draft: '📝 Draft',
      registration_open: '🟢 Registration Open',
      registration_closed: '🔒 Registration Closed',
      groups_generated: '📊 Groups Generated',
      group_stage_active: '🏸 Group Stage Active',
      group_stage_completed: '✅ Group Stage Complete',
      knockouts_generated: '🏆 Knockouts Generated',
      knockouts_active: '⚡ Knockouts Active',
      completed: '🎉 Completed',
    };

    const allGroupMatchesComplete = tournament.matches
      .filter((m: any) => m.phase === 'group')
      .every((m: any) => m.status === 'completed');

    return (
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Status Banner */}
        <div className="p-3 bg-amber-900/20 border border-amber-700/40 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-amber-400 font-semibold">🏆 {tournament.name}</div>
            <div className="text-slate-300 text-sm">{statusLabel[cs] ?? cs}</div>
          </div>
          <div className="text-right text-sm text-slate-400">
            <div>{tournament.maxTeams} max teams · {tournament.teamsPerGroup}/group · {tournament.numberOfGroups} groups</div>
            <div>{tournament.numberOfTeams} teams registered</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          {cs === 'registration_open' && (
            <ShareLinkButton tournamentId={selectedTournament!._id} />
          )}
          {cs === 'draft' && (
            <Button onClick={openRegistration} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white border-0">
              🟢 Open Registration
            </Button>
          )}
          {cs === 'registration_open' && (
            <Button onClick={closeRegistration} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white border-0">
              🔒 Close Registration
            </Button>
          )}
          {cs === 'registration_closed' && (
            <Button onClick={generateGroupsAction} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white border-0">
              📊 Generate Groups
            </Button>
          )}
          {cs === 'group_stage_active' && allGroupMatchesComplete && (
            <Button onClick={confirmGroupStageAction} disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white border-0">
              ✅ Confirm Standings &amp; Generate Championships
            </Button>
          )}
          {cs === 'group_stage_active' && !allGroupMatchesComplete && (
            <div className="text-slate-400 text-sm py-2">
              {tournament.matches.filter((m: any) => m.phase === 'group' && m.status !== 'completed').length} group matches remaining before you can confirm standings
            </div>
          )}
          {cs === 'group_stage_completed' && (
            <Button onClick={generateChampionshipsAction} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white border-0">
              🏆 Generate Championship Brackets
            </Button>
          )}
          <Button onClick={() => deleteTournament(tournament._id)} disabled={loading} variant="outline" size="sm"
            className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white ml-auto">
            🗑️ Delete
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {(['overview', 'registrations', 'groups', 'group-matches', 'standings', 'championships'] as const).map(tab => (
            <button key={tab} onClick={() => {
              setChampTab(tab);
              if (tab === 'registrations') fetchRegistrations(tournament._id);
              if (tab === 'groups') fetchGroups(tournament._id);
              if (tab === 'standings') fetchGroups(tournament._id);
              if (tab === 'championships') fetchBrackets(tournament._id);
            }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
                champTab === tab
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {champTab === 'overview' && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
                <div><div className="text-2xl font-bold text-amber-400">{tournament.numberOfTeams}</div><div className="text-slate-400 text-sm">Teams</div></div>
                <div><div className="text-2xl font-bold text-purple-400">{tournament.numberOfGroups}</div><div className="text-slate-400 text-sm">Groups</div></div>
                <div><div className="text-2xl font-bold text-cyan-400">{tournament.matches.filter((m: any) => m.phase === 'group').length}</div><div className="text-slate-400 text-sm">Group Matches</div></div>
                <div><div className="text-2xl font-bold text-green-400">{tournament.matches.filter((m: any) => m.status === 'completed').length}</div><div className="text-slate-400 text-sm">Completed</div></div>
              </div>
              {tournament.qualificationSnapshot && tournament.qualificationSnapshot.length > 0 && (
                <div className="mt-4">
                  <div className="text-slate-300 font-semibold mb-2">Qualification Snapshot</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['gold', 'silver', 'bronze'] as const).map(c => (
                      <div key={c} className="bg-slate-700 rounded-lg p-3">
                        <div className={`font-semibold text-sm mb-2 ${c === 'gold' ? 'text-yellow-400' : c === 'silver' ? 'text-slate-300' : 'text-orange-400'}`}>
                          {c === 'gold' ? '🥇' : c === 'silver' ? '🥈' : '🥉'} {c.charAt(0).toUpperCase() + c.slice(1)}
                        </div>
                        {tournament.qualificationSnapshot!.filter(q => q.championship === c).map((q, i) => (
                          <div key={i} className="text-xs text-slate-300">{q.teamName} <span className="text-slate-500">({q.groupName} #{q.rank})</span></div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Registrations Tab ── */}
        {champTab === 'registrations' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Accepted Teams</span>
                  <span className="text-white font-semibold">
                    {registrations.filter(r => r.status === 'accepted').length} / {tournament.maxTeams}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full">
                  <div
                    className="h-2 bg-green-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (registrations.filter(r => r.status === 'accepted').length / (tournament.maxTeams ?? 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {registrations.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="text-center py-8 text-slate-400">
                  {cs === 'registration_open' ? 'No registrations yet. Share the registration link with teams.' : 'No registrations found.'}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {registrations.map(reg => (
                  <Card key={reg._id} className={`border ${
                    reg.status === 'accepted' ? 'bg-green-900/10 border-green-700/40' :
                    reg.status === 'rejected' ? 'bg-red-900/10 border-red-700/40' :
                    reg.status === 'waitlisted' ? 'bg-yellow-900/10 border-yellow-700/40' :
                    'bg-slate-800 border-slate-700'
                  }`}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-semibold text-white">{reg.teamName}</div>
                          <div className="text-sm text-slate-400">{reg.players.join(', ')}</div>
                          <div className="text-xs text-slate-500 mt-1">{reg.contactEmail} · {new Date(reg.appliedAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            reg.status === 'accepted' ? 'bg-green-900/30 text-green-400 border-green-700/40' :
                            reg.status === 'rejected' ? 'bg-red-900/30 text-red-400 border-red-700/40' :
                            reg.status === 'waitlisted' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/40' :
                            'bg-slate-700 text-slate-300 border-slate-600'
                          }`}>{reg.status}</span>
                          {reg.status === 'pending' || reg.status === 'waitlisted' ? (
                            <div className="flex gap-1">
                              <button onClick={() => updateRegistrationStatus(reg._id, 'accepted')}
                                className="text-xs px-2 py-0.5 bg-green-700 hover:bg-green-600 text-white rounded">Accept</button>
                              <button onClick={() => updateRegistrationStatus(reg._id, 'rejected')}
                                className="text-xs px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded">Reject</button>
                              {reg.status !== 'waitlisted' && (
                                <button onClick={() => updateRegistrationStatus(reg._id, 'waitlisted')}
                                  className="text-xs px-2 py-0.5 bg-yellow-700 hover:bg-yellow-600 text-white rounded">Waitlist</button>
                              )}
                            </div>
                          ) : reg.status === 'accepted' ? (
                            <button onClick={() => updateRegistrationStatus(reg._id, 'rejected')}
                              className="text-xs px-2 py-0.5 border border-red-600 text-red-400 hover:bg-red-900/20 rounded">Revoke</button>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Groups Tab ── */}
        {champTab === 'groups' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.length === 0 && (
              <div className="col-span-full text-center text-slate-400 py-8">
                {cs === 'registration_closed' ? 'Click "Generate Groups" to create groups.' : 'Groups will appear here after they are generated.'}
              </div>
            )}
            {groups.map((group) => (
              <Card key={group._id} className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-amber-400 text-base">{group.name}</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">{group.teamIndices.length} teams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {(group.standings ?? group.teamIndices.map((ti, rank) => ({
                      teamIndex: ti,
                      teamName: tournament.teams[ti]?.name ?? `Team ${ti}`,
                      rank: rank + 1,
                      wins: 0, losses: 0, matchesPlayed: 0, pointDifference: 0,
                    }))).map((stat: any, rank: number) => {
                      const qualEntry = tournament.qualificationSnapshot?.find(q => q.teamIndex === stat.teamIndex);
                      return (
                        <div key={rank} className="flex items-center gap-2 text-sm py-1 border-b border-slate-700/40 last:border-0">
                          <span className="text-slate-500 w-4 shrink-0">{rank + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{stat.teamName ?? tournament.teams[stat.teamIndex]?.name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {tournament.teams[stat.teamIndex]?.players?.join(' & ') ?? ''}
                            </p>
                          </div>
                          <span className="text-slate-500 text-xs shrink-0">{stat.wins}W {stat.losses}L</span>
                          {qualEntry && (
                            <span className={`text-xs px-1 rounded ${
                              qualEntry.championship === 'gold' ? 'bg-yellow-900/30 text-yellow-400' :
                              qualEntry.championship === 'silver' ? 'bg-slate-700 text-slate-300' :
                              'bg-orange-900/30 text-orange-400'
                            }`}>{qualEntry.championship === 'gold' ? '🥇' : qualEntry.championship === 'silver' ? '🥈' : '🥉'}</span>
                          )}
                          {!qualEntry && cs === 'group_stage_active' && (
                            <span className="text-xs text-slate-600">{
                              tournament.qualificationRules?.gold?.includes(rank + 1) ? '→🥇' :
                              tournament.qualificationRules?.silver?.includes(rank + 1) ? '→🥈' :
                              tournament.qualificationRules?.bronze?.includes(rank + 1) ? '→🥉' : ''
                            }</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Group Matches Tab ── */}
        {champTab === 'group-matches' && (
          <GroupMatchesPanel
            tournament={tournament}
            groups={groups}
            onSave={(matchIndex, s1, s2) => updateMatchScore(matchIndex, s1, s2)}
          />
        )}

        {/* ── Standings Tab ── */}
        {champTab === 'standings' && (
          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="text-center text-slate-400 py-8">Load groups first from the Groups tab.</div>
            ) : groups.map((group) => (
              <Card key={group._id} className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-amber-400">{group.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        {['#', 'Team', 'MP', 'W', 'L', '+/-'].map(h => (
                          <th key={h} className="text-left py-2 px-2 text-cyan-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(group.standings ?? []).map((stat: any, rank: number) => {
                        const qualEntry = tournament.qualificationSnapshot?.find(q => q.teamIndex === stat.teamIndex);
                        const projected = !qualEntry && (
                          tournament.qualificationRules?.gold?.includes(rank + 1) ? 'gold' :
                          tournament.qualificationRules?.silver?.includes(rank + 1) ? 'silver' :
                          tournament.qualificationRules?.bronze?.includes(rank + 1) ? 'bronze' : null
                        );
                        return (
                          <tr key={rank} className="border-b border-slate-700/50">
                            <td className="py-2 px-2 text-slate-500">{rank + 1}</td>
                            <td className="py-2 px-2">
                              <span className="text-white">{stat.teamName}</span>
                              {qualEntry && (
                                <span className={`ml-2 text-xs px-1 rounded ${qualEntry.championship === 'gold' ? 'text-yellow-400' : qualEntry.championship === 'silver' ? 'text-slate-300' : 'text-orange-400'}`}>
                                  {qualEntry.championship === 'gold' ? '🥇' : qualEntry.championship === 'silver' ? '🥈' : '🥉'} Qualified
                                </span>
                              )}
                              {projected && !qualEntry && (
                                <span className={`ml-2 text-xs opacity-60 ${projected === 'gold' ? 'text-yellow-400' : projected === 'silver' ? 'text-slate-300' : 'text-orange-400'}`}>
                                  → {projected === 'gold' ? '🥇' : projected === 'silver' ? '🥈' : '🥉'}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-slate-400">{stat.matchesPlayed}</td>
                            <td className="py-2 px-2 text-green-400">{stat.wins}</td>
                            <td className="py-2 px-2 text-red-400">{stat.losses}</td>
                            <td className={`py-2 px-2 font-bold ${stat.pointDifference > 0 ? 'text-green-400' : stat.pointDifference < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                              {stat.pointDifference > 0 ? '+' : ''}{stat.pointDifference}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Championships Tab ── */}
        {champTab === 'championships' && (
          <div className="space-y-6">
            {bracketData.gold.length === 0 && bracketData.silver.length === 0 && bracketData.bronze.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                {cs === 'group_stage_completed'
                  ? 'Click "Generate Championship Brackets" to create the knockout draws.'
                  : 'Championship brackets will appear here after the group stage is confirmed.'}
              </div>
            ) : (
              <>
                {/* Sub-tabs */}
                <div className="flex gap-1 flex-wrap">
                  {(['gold', 'silver', 'bronze', 'overall'] as const).map(c => (
                    <button key={c} onClick={() => setChampSubTab(c as any)}
                      className={`px-4 py-1.5 text-sm rounded-md transition-colors capitalize ${
                        champSubTab === c
                          ? c === 'gold' ? 'bg-yellow-700 text-white' : c === 'silver' ? 'bg-slate-500 text-white' : c === 'bronze' ? 'bg-orange-700 text-white' : 'bg-cyan-700 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {c === 'gold' ? '🥇' : c === 'silver' ? '🥈' : c === 'bronze' ? '🥉' : '📊'} {c}
                    </button>
                  ))}
                </div>
                {champSubTab === 'overall' ? (
                  <OverallStandings bracketData={bracketData} teams={tournament.teams} />
                ) : (
                <ChampionshipBracket
                  championship={champSubTab as 'gold' | 'silver' | 'bronze'}
                  matches={bracketData[champSubTab as 'gold' | 'silver' | 'bronze']}
                  teams={tournament.teams}
                  onScoreMatch={(matchIndex, _match, score1, score2) => {
                    updateMatchScore(matchIndex, score1, score2);
                    // Refresh brackets after a short delay to reflect winner advancement
                    setTimeout(() => fetchBrackets(tournament._id), 600);
                  }}
                />
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>

      {/* Confirmation modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={hideConfirmation}
      />

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Tournaments</h1>
            <p className="text-slate-400 mt-1">Create and manage badminton tournaments</p>
          </div>
          {selectedTournament && (
            <Button
              onClick={() => {
                setSelectedTournament(null);
                setShowMatches(false);
                setShowStandings(false);
              }}
              variant="outline"
              className="border-teal-500 text-teal-400 hover:bg-teal-500 hover:text-white"
            >
              ← Back to Tournament List
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {createFormat === 'championship-groups' ? (
        <CreateChampionshipWizard />
      ) : showCreateForm ? (
        <CreateTournamentForm />
      ) : selectedTournament ? (
        <div>
          {/* Tournament Header */}
          <div className="text-center mb-8">
            <Card className="max-w-2xl mx-auto bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-2xl text-cyan-400">
                  {selectedTournament.name}
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {selectedTournament.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">{selectedTournament.numberOfTeams}</div>
                    <div className="text-slate-400">Teams</div>
                  </div>
                  {selectedTournament.tournamentFormat === 'court-based' ? (
                    <div>
                      <div className="text-2xl font-bold text-pink-400">{selectedTournament.numberOfCourts}</div>
                      <div className="text-slate-400">Courts</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl font-bold text-purple-400">{selectedTournament.roundsPerOpponent}x</div>
                      <div className="text-slate-400">Rounds</div>
                    </div>
                  )}
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {new Date(selectedTournament.scheduledDate).toLocaleDateString()}
                    </div>
                    <div className="text-slate-400">Scheduled Date</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400 capitalize">{selectedTournament.status}</div>
                    <div className="text-slate-400">Status</div>
                  </div>
                </div>

                {/* Action Buttons - Organized in rows */}
                <div className="space-y-3 mt-6">
                  {/* Tournament Action Buttons Row */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {/* Confirm Tournament Button */}
                    {selectedTournament.status === 'scheduled' &&
                     selectedTournament.teams.every(team => team.players.length === 2) && (
                      <Button
                        onClick={confirmTournament}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                      >
                        {loading ? 'Confirming...' : '✓ Confirm Tournament'}
                      </Button>
                    )}

                    {/* Start Tournament Button */}
                    {selectedTournament.status === 'confirmed' && (
                      <Button
                        onClick={startTournament}
                        disabled={loading}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
                      >
                        {loading ? 'Starting...' : '🚀 Start Tournament'}
                      </Button>
                    )}
                  </div>

                  {/* View Controls and Complete Tournament Row - Show when in progress */}
                  {selectedTournament.status === 'in-progress' && (
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button
                        onClick={() => {
                          setShowMatches(!showMatches);
                          setShowStandings(false);
                          if (!showMatches) fetchStandings();
                        }}
                        variant={showMatches ? "default" : "outline"}
                        className={`flex-1 min-w-[140px] ${showMatches
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                          : "border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                        }`}
                      >
                        {showMatches ? '👥 Managing Teams' : '🎯 View Matches'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowStandings(!showStandings);
                          setShowMatches(false);
                          if (!showStandings) fetchStandings();
                        }}
                        variant={showStandings ? "default" : "outline"}
                        className={`flex-1 min-w-[140px] ${showStandings
                          ? "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-0"
                          : "border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white"
                        }`}
                      >
                        {showStandings ? '📊 Viewing Standings' : '📊 View Standings'}
                      </Button>
                      <Button
                        onClick={completeTournament}
                        disabled={loading}
                        className="flex-1 min-w-[140px] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0"
                      >
                        {loading ? 'Completing...' : '🏆 Complete Tournament'}
                      </Button>
                    </div>
                  )}

                  {/* Final Standings - Show when completed */}
                  {selectedTournament.status === 'completed' && (
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button
                        onClick={async () => {
                          setShowStandings(!showStandings);
                          setShowMatches(false);
                          if (!showStandings) {
                            if (selectedTournament.standings) {
                              setCurrentStandings(selectedTournament.standings);
                            } else {
                              await fetchStandings();
                            }
                          }
                        }}
                        disabled={loading}
                        variant={showStandings ? "default" : "outline"}
                        className={showStandings
                          ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border-0"
                          : "border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black"
                        }
                      >
                        {loading ? 'Loading...' : (showStandings ? '🏆 Viewing Results' : '🏆 View Final Results')}
                      </Button>
                    </div>
                  )}

                  {/* Danger Zone Row */}
                  <div className="flex justify-center pt-2 border-t border-slate-700 mt-3">
                    <Button
                      onClick={() => deleteTournament(selectedTournament._id)}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      {loading ? 'Deleting...' : '🗑️ Delete Tournament'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Based on View */}
          {selectedTournament.tournamentFormat === 'championship-groups' ? (
            <ChampionshipManagement tournament={selectedTournament} />
          ) : showStandings ? (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                {selectedTournament.status === 'completed' ? 'Final Tournament Results' : 'Live Tournament Standings'}
              </h2>
              {currentStandings.length > 0 ? (
                <StandingsTable standings={currentStandings} tournament={selectedTournament} />
              ) : (
                <Card className="max-w-md mx-auto bg-slate-800 border-slate-700">
                  <CardContent className="text-center py-8">
                    <div className="text-4xl mb-4">📊</div>
                    <div className="text-slate-300 mb-2">
                      {selectedTournament.status === 'completed' ? 'Loading final results...' : 'Loading standings...'}
                    </div>
                    <Button
                      onClick={fetchStandings}
                      disabled={loading}
                      className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0"
                    >
                      {loading ? 'Loading...' : 'Refresh Standings'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : showMatches && selectedTournament.matches.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">Match Schedule</h2>
              <div className="text-center mb-4 text-slate-300">
                <div className="text-lg">
                  Total Matches: <span className="text-cyan-400 font-bold">{selectedTournament.matches.length}</span>
                </div>
                <div className="text-sm text-slate-400">
                  {selectedTournament.tournamentFormat === 'court-based' ? (
                    <>Each team plays {selectedTournament.numberOfTeams - 1} matches</>
                  ) : (
                    <>Each team plays {(selectedTournament.numberOfTeams - 1) * (selectedTournament.roundsPerOpponent || 1)} matches ({selectedTournament.roundsPerOpponent}x per opponent)</>
                  )}
                </div>
              </div>
              <MatchSchedule tournament={selectedTournament} />
            </div>
          ) : (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                {selectedTournament.status === 'scheduled' ? 'Manage Teams' : 'Team Overview'}
              </h2>
              <TeamManagement tournament={selectedTournament} />
              {selectedTournament.status === 'scheduled' && (
                <div className="text-center mt-6 p-4 bg-slate-700 rounded-lg max-w-2xl mx-auto">
                  <div className="text-slate-300 mb-2">
                    {selectedTournament.teams.every(team => team.players.length === 2) ? (
                      <>All teams have 2 players! Click &quot;Confirm Tournament&quot; to proceed.</>
                    ) : (
                      <>Make sure all teams have exactly 2 players before confirming the tournament.</>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">
                    {selectedTournament.tournamentFormat === 'court-based' ? (
                      <>Tournament will generate {(selectedTournament.numberOfTeams * (selectedTournament.numberOfTeams - 1)) / 2} matches across {selectedTournament.numberOfCourts} courts.</>
                    ) : (
                      <>Tournament will generate {(selectedTournament.numberOfTeams * (selectedTournament.numberOfTeams - 1)) / 2 * (selectedTournament.roundsPerOpponent || 1)} total matches ({selectedTournament.roundsPerOpponent} rounds).</>
                    )}
                  </div>
                  {!selectedTournament.teams.every(team => team.players.length === 2) && (
                    <div className="text-sm text-orange-400 mt-2">
                      Teams missing players: {selectedTournament.teams.filter(team => team.players.length !== 2).length}
                    </div>
                  )}
                </div>
              )}
              {selectedTournament.status === 'confirmed' && (
                <div className="text-center mt-6 p-4 bg-green-900/30 border border-green-600 rounded-lg max-w-2xl mx-auto">
                  <div className="text-green-400 mb-2">
                    ✅ Tournament confirmed! All teams are ready.
                  </div>
                  <div className="text-sm text-green-300">
                    Click &quot;Start Tournament&quot; to begin the competition and generate matches.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Tournament List */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-400">{tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} total</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0"
            >
              + Create New Tournament
            </Button>
          </div>

          {tournaments.length === 0 ? (
            <Card className="max-w-md mx-auto bg-slate-800 border-slate-700">
              <CardContent className="text-center py-8">
                <div className="text-4xl mb-4">🏸</div>
                <div className="text-slate-300">No tournaments created yet</div>
                <div className="text-slate-500 text-sm">Create your first tournament to get started</div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => (
                <Card key={tournament._id} className="bg-slate-800 border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-cyan-400">{tournament.name}</CardTitle>
                    <CardDescription className="text-slate-300">
                      {tournament.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-slate-300 mb-4">
                      <div className="font-semibold text-cyan-400 capitalize">{tournament.tournamentFormat.replace('-', ' ')} Format</div>
                      <div>
                        Teams: {tournament.numberOfTeams} |
                        {tournament.tournamentFormat === 'court-based'
                          ? ` Courts: ${tournament.numberOfCourts}`
                          : ` Rounds: ${tournament.roundsPerOpponent}x`}
                      </div>
                      <div>Date: {new Date(tournament.scheduledDate).toLocaleDateString()}</div>
                      <div>Status: <span className={`capitalize font-semibold ${
                        tournament.status === 'completed' ? 'text-yellow-400' :
                        tournament.status === 'in-progress' ? 'text-green-400' :
                        tournament.status === 'confirmed' ? 'text-blue-400' : 'text-slate-400'
                      }`}>{tournament.status}</span></div>
                      <div>Matches: {tournament.matches?.length || 0}</div>
                      {tournament.status === 'completed' && tournament.matches && (
                        <div>Completed: {tournament.matches.filter(m => m.status === 'completed').length}/{tournament.matches.length}</div>
                      )}
                      <div>Created: {new Date(tournament.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setShowMatches(false);
                          setShowStandings(false);
                          setCurrentStandings([]);

                          if (tournament.status === 'completed') {
                            setTimeout(() => {
                              if (tournament.standings) {
                                setCurrentStandings(tournament.standings);
                                setShowStandings(true);
                              }
                            }, 100);
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0"
                      >
                        {tournament.status === 'completed' ? 'View Results' : 'Manage'}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTournament(tournament._id);
                        }}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
