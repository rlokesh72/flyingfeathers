'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
}

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

interface Tournament {
  _id: string;
  name: string;
  description?: string;
  numberOfTeams: number;
  numberOfCourts: number;
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

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showMatches, setShowMatches] = useState(false);
  const [showStandings, setShowStandings] = useState(false);
  const [currentStandings, setCurrentStandings] = useState<TeamStats[]>([]);
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
  const router = useRouter();

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
          setUser(parsedUser);
          fetchTournaments();
        } else {
          console.log('Invalid user data in localStorage');
          localStorage.removeItem('user');
          router.push('/login');
        }
      } else {
        console.log('No valid user data found in localStorage');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments', {
        credentials: 'include', // Include cookies
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
    numberOfCourts: number;
    scheduledDate: string;
  }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies
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
        credentials: 'include', // Include cookies
        body: JSON.stringify({ teamIndex, teamName, players }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTournament(data.tournament);
        setTournaments(tournaments.map(t => 
          t._id === data.tournament._id ? data.tournament : t
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
            credentials: 'include', // Include cookies
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
        credentials: 'include', // Include cookies
      });
      
      if (response.ok) {
        // Refresh tournament data
        const tournamentResponse = await fetch('/api/tournaments', {
          credentials: 'include', // Include cookies
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
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTournament(data.tournament);
        setTournaments(tournaments.map(t => 
          t._id === data.tournament._id ? data.tournament : t
        ));
        setShowMatches(true);
        // Initialize standings for the started tournament
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
        credentials: 'include', // Include cookies
        body: JSON.stringify({ team1Score, team2Score, status: 'completed' }),
      });

      if (response.ok) {
        // Refresh tournament data
        const tournamentResponse = await fetch('/api/tournaments', {
          credentials: 'include', // Include cookies
        });
        if (tournamentResponse.ok) {
          const data = await tournamentResponse.json();
          const updatedTournament = data.tournaments.find((t: Tournament) => t._id === selectedTournament._id);
          if (updatedTournament) {
            setSelectedTournament(updatedTournament);
            setTournaments(data.tournaments);
          }
        }
        // Refresh standings after score update
        fetchStandings();
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
        credentials: 'include', // Include cookies
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentStandings(data.standings);
      }
    } catch (error) {
      console.error('Error fetching standings:', error);
    }
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
            credentials: 'include', // Include cookies
          });
          
          if (response.ok) {
            const data = await response.json();
            const completedTournament = data.tournament;
            const finalStandings = data.standings;
            
            // Update the selected tournament with the completed data
            setSelectedTournament(completedTournament);
            
            // Update the tournaments list with the completed tournament
            setTournaments(tournaments.map(t => 
              t._id === selectedTournament._id ? completedTournament : t
            ));
            
            // Set the final standings and show them
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Create Tournament Form Component
  const CreateTournamentForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      numberOfTeams: 4,
      numberOfCourts: 2,
      scheduledDate: '',
    });

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

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Scheduled Date
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
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

  // Team Management Component
  const TeamManagement = ({ tournament }: { tournament: Tournament }) => {
    const [editingTeam, setEditingTeam] = useState<number | null>(null);
    const [teamData, setTeamData] = useState({ name: '', players: [''] });

    const startEditing = (teamIndex: number) => {
      const team = tournament.teams[teamIndex];
      // Ensure exactly 2 player slots
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
                    <th className="text-center py-3 px-2 text-cyan-400">W</th>
                    <th className="text-center py-3 px-2 text-cyan-400">L</th>
                    <th className="text-center py-3 px-2 text-cyan-400">PF</th>
                    <th className="text-center py-3 px-2 text-cyan-400">PA</th>
                    <th className="text-center py-3 px-2 text-cyan-400">+/-</th>
                    <th className="text-center py-3 px-2 text-cyan-400">MP</th>
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
                      <td className="py-3 px-2 text-center">
                        <span className="text-slate-300">{team.matchesPlayed}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-slate-400 text-center">
              W = Wins | L = Losses | PF = Points For | PA = Points Against | +/- = Point Difference | MP = Matches Played
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Match Schedule Component
  const MatchSchedule = ({ tournament }: { tournament: Tournament }) => {
    const [editingMatch, setEditingMatch] = useState<number | null>(null);
    const [scoreData, setScoreData] = useState({ team1Score: 0, team2Score: 0 });

    const startScoreEdit = (matchIndex: number, match: Match) => {
      setScoreData({
        team1Score: match.team1Score || 0,
        team2Score: match.team2Score || 0
      });
      setEditingMatch(matchIndex);
    };

    const saveScore = (matchIndex: number) => {
      updateMatchScore(matchIndex, scoreData.team1Score, scoreData.team2Score);
      setEditingMatch(null);
    };

    // Group matches by time slot
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
                        Court {match.court}
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
                              type="number"
                              value={scoreData.team1Score}
                              onChange={(e) => setScoreData({...scoreData, team1Score: parseInt(e.target.value) || 0})}
                              className="w-20 px-3 py-2 bg-slate-600 border-2 border-cyan-500 rounded-md text-white text-center text-lg font-semibold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                              min="0"
                              placeholder="0"
                              autoFocus
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
                              type="number"
                              value={scoreData.team2Score}
                              onChange={(e) => setScoreData({...scoreData, team2Score: parseInt(e.target.value) || 0})}
                              className="w-20 px-3 py-2 bg-slate-600 border-2 border-pink-500 rounded-md text-white text-center text-lg font-semibold focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                              min="0"
                              placeholder="0"
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
                              className="w-full border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white"
                              disabled={match.status === 'completed'}
                            >
                              {match.status === 'completed' ? 'Completed' : 'Log Score'}
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <img 
              src="/flying-feathers-logo.png" 
              alt="Flying Feathers Badminton Club Logo" 
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Tournament Management
          </h1>
          <p className="text-lg text-cyan-400 mb-4">
            Welcome back, {user.name}!
          </p>
          <div className="flex gap-4 justify-center mb-6">
            <Button 
              onClick={() => router.push('/')}
              variant="outline" 
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white"
            >
              Back to Home
            </Button>
            <Button 
              onClick={() => router.push('/change-password')}
              variant="outline" 
              className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
            >
              Change Password
            </Button>
            <Button 
              onClick={handleLogout}
              variant="outline" 
              className="border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-white"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {showCreateForm ? (
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
                    <div>
                      <div className="text-2xl font-bold text-pink-400">{selectedTournament.numberOfCourts}</div>
                      <div className="text-slate-400">Courts</div>
                    </div>
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
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button 
                      onClick={() => {
                        setSelectedTournament(null);
                        setShowMatches(false);
                      }}
                      className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white border-0"
                    >
                      Back to Tournament List
                    </Button>
                    
                    {/* Confirm Tournament Button - Show when all teams have 2 players */}
                    {selectedTournament.status === 'scheduled' && 
                     selectedTournament.teams.every(team => team.players.length === 2) && (
                      <Button 
                        onClick={confirmTournament}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                      >
                        {loading ? 'Confirming...' : 'Confirm Tournament'}
                      </Button>
                    )}
                    
                    {/* Start Tournament Button - Show when confirmed */}
                    {selectedTournament.status === 'confirmed' && (
                      <Button 
                        onClick={startTournament}
                        disabled={loading}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
                      >
                        {loading ? 'Starting...' : 'Start Tournament'}
                      </Button>
                    )}
                    
                    {/* View/Manage Toggle - Show when in progress */}
                    {selectedTournament.status === 'in-progress' && (
                      <>
                        <Button 
                          onClick={() => {
                            setShowMatches(!showMatches);
                            setShowStandings(false);
                            if (!showMatches) fetchStandings();
                          }}
                          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                        >
                          {showMatches ? 'Manage Teams' : 'View Matches'}
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowStandings(!showStandings);
                            setShowMatches(false);
                            if (!showStandings) fetchStandings();
                          }}
                          className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-0"
                        >
                          {showStandings ? 'Hide Standings' : 'View Standings'}
                        </Button>
                        <Button 
                          onClick={completeTournament}
                          disabled={loading}
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0"
                        >
                          {loading ? 'Completing...' : 'Complete Tournament'}
                        </Button>
                      </>
                    )}

                    {/* Final Standings - Show when completed */}
                    {selectedTournament.status === 'completed' && (
                      <Button 
                        onClick={async () => {
                          setShowStandings(!showStandings);
                          setShowMatches(false);
                          if (!showStandings) {
                            // Always fetch fresh standings for completed tournaments
                            if (selectedTournament.standings) {
                              setCurrentStandings(selectedTournament.standings);
                            } else {
                              // Fallback: fetch from API if standings not in local data
                              await fetchStandings();
                            }
                          }
                        }}
                        disabled={loading}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border-0"
                      >
                        {loading ? 'Loading...' : (showStandings ? 'Hide Standings' : 'View Final Standings')}
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => deleteTournament(selectedTournament._id)}
                      disabled={loading}
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      {loading ? 'Deleting...' : 'Delete Tournament'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Based on View */}
            {showStandings ? (
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
                    Each team plays {selectedTournament.numberOfTeams - 1} matches
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
                      Tournament will generate {(selectedTournament.numberOfTeams * (selectedTournament.numberOfTeams - 1)) / 2} matches 
                      across {selectedTournament.numberOfCourts} courts.
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
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Tournaments</h2>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0"
              >
                Create New Tournament
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                        <div>Teams: {tournament.numberOfTeams} | Courts: {tournament.numberOfCourts}</div>
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
                            // Reset view states
                            setShowMatches(false);
                            setShowStandings(false);
                            setCurrentStandings([]);
                            
                            // For completed tournaments, auto-show final standings
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
    </main>
  );
} 