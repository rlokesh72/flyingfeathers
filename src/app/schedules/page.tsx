'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Match {
  team1Index: number;
  team2Index: number;
  court: number;
  timeSlot: number;
  team1Score?: number;
  team2Score?: number;
  status: 'scheduled' | 'in-progress' | 'completed';
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
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
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

export default function SchedulesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<TeamStats[]>([]);
  const [showStandings, setShowStandings] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments?public=true');
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

  const fetchStandings = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/standings?public=true`);
      if (response.ok) {
        const data = await response.json();
        setStandings(data.standings);
        setShowStandings(true);
      }
    } catch (error) {
      console.error('Error fetching standings:', error);
    }
  };

  const MatchSchedule = ({ tournament }: { tournament: Tournament }) => {
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
                          <div className="text-2xl font-bold text-cyan-400">
                            {match.team1Score !== undefined ? match.team1Score : '-'}
                          </div>
                        </div>

                        <div className="text-center text-slate-500 font-bold">VS</div>

                        <div className="flex justify-between items-center">
                          <div className="text-slate-300">
                            <div className="font-medium">{tournament.teams[match.team2Index]?.name}</div>
                            <div className="text-sm text-slate-400">
                              {tournament.teams[match.team2Index]?.players.join(', ')}
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-pink-400">
                            {match.team2Score !== undefined ? match.team2Score : '-'}
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className={`text-center text-sm font-medium px-3 py-1 rounded-full ${
                            match.status === 'completed' ? 'bg-green-900/30 text-green-400 border border-green-600' :
                            match.status === 'in-progress' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-600' :
                            'bg-slate-900/30 text-slate-400 border border-slate-600'
                          }`}>
                            {match.status === 'completed' ? 'Completed' : 
                             match.status === 'in-progress' ? 'In Progress' : 'Scheduled'}
                          </div>
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

  const StandingsTable = () => {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Tournament Standings</h2>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-cyan-400 font-semibold">Rank</th>
                    <th className="px-4 py-3 text-left text-cyan-400 font-semibold">Team</th>
                    <th className="px-4 py-3 text-left text-cyan-400 font-semibold">Players</th>
                    <th className="px-4 py-3 text-center text-cyan-400 font-semibold">MP</th>
                    <th className="px-4 py-3 text-center text-cyan-400 font-semibold">W</th>
                    <th className="px-4 py-3 text-center text-cyan-400 font-semibold">L</th>
                    <th className="px-4 py-3 text-center text-cyan-400 font-semibold">PF</th>
                    <th className="px-4 py-3 text-center text-cyan-400 font-semibold">PA</th>
                    <th className="px-4 py-3 text-center text-cyan-400 font-semibold">+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, index) => (
                    <tr key={team.teamIndex} className={`border-t border-slate-600 ${index === 0 ? 'bg-yellow-900/20' : index === 1 ? 'bg-slate-700/50' : index === 2 ? 'bg-amber-900/20' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className={`font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-300'}`}>
                            #{index + 1}
                          </span>
                          {index === 0 && <span className="ml-2 text-yellow-400">🏆</span>}
                          {index === 1 && <span className="ml-2 text-slate-300">🥈</span>}
                          {index === 2 && <span className="ml-2 text-amber-600">🥉</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-medium">{team.teamName}</td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{team.players.join(', ')}</td>
                      <td className="px-4 py-3 text-center text-slate-300 font-semibold">{team.matchesPlayed}</td>
                      <td className="px-4 py-3 text-center text-green-400 font-semibold">{team.wins}</td>
                      <td className="px-4 py-3 text-center text-red-400 font-semibold">{team.losses}</td>
                      <td className="px-4 py-3 text-center text-cyan-400 font-semibold">{team.pointsFor}</td>
                      <td className="px-4 py-3 text-center text-pink-400 font-semibold">{team.pointsAgainst}</td>
                      <td className={`px-4 py-3 text-center font-semibold ${team.pointDifference > 0 ? 'text-green-400' : team.pointDifference < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {team.pointDifference > 0 ? '+' : ''}{team.pointDifference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading tournaments...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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
            Tournament Schedules
          </h1>
          <p className="text-lg text-cyan-400 mb-4">
            View upcoming matches and results
          </p>
          <div className="flex gap-4 justify-center mb-6">
            <Button 
              onClick={() => router.push('/')}
              variant="outline" 
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white"
            >
              Back to Home
            </Button>
          </div>
        </div>

        {/* Tournament Selection or Schedule View */}
        {selectedTournament ? (
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
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
                      <div className={`text-2xl font-bold capitalize ${
                        selectedTournament.status === 'completed' ? 'text-yellow-400' : 
                        selectedTournament.status === 'in-progress' ? 'text-green-400' : 
                        selectedTournament.status === 'confirmed' ? 'text-blue-400' : 'text-slate-400'
                      }`}>{selectedTournament.status}</div>
                      <div className="text-slate-400">Status</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <Button 
                      onClick={() => {
                        setShowStandings(false);
                      }}
                      className={`flex-1 ${!showStandings ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700' : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800'} text-white border-0`}
                      disabled={!selectedTournament.matches || selectedTournament.matches.length === 0}
                    >
                      View Matches
                    </Button>
                    <Button 
                      onClick={() => fetchStandings(selectedTournament._id)}
                      className={`flex-1 ${showStandings ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800'} text-white border-0`}
                      disabled={!selectedTournament.matches || selectedTournament.matches.length === 0}
                    >
                      View Standings
                    </Button>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedTournament(null);
                      setShowStandings(false);
                      setStandings([]);
                    }}
                    className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white border-0"
                  >
                    Back to Tournament List
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Content Area - Show either matches or standings */}
            {showStandings ? (
              standings.length > 0 ? (
                <StandingsTable />
              ) : (
                <Card className="max-w-md mx-auto bg-slate-800 border-slate-700">
                  <CardContent className="text-center py-8">
                    <div className="text-4xl mb-4">📊</div>
                    <div className="text-slate-300">No standings data available</div>
                    <div className="text-slate-500 text-sm">Standings will appear once matches are completed</div>
                  </CardContent>
                </Card>
              )
            ) : (
              selectedTournament.matches.length > 0 ? (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4 text-center">Match Schedule</h2>
                  <div className="text-center mb-4 text-slate-300">
                    <div className="text-lg">
                      Total Matches: <span className="text-cyan-400 font-bold">{selectedTournament.matches.length}</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      Completed: {selectedTournament.matches.filter(m => m.status === 'completed').length} / {selectedTournament.matches.length}
                    </div>
                  </div>
                  <MatchSchedule tournament={selectedTournament} />
                </div>
              ) : (
                <Card className="max-w-md mx-auto bg-slate-800 border-slate-700">
                  <CardContent className="text-center py-8">
                    <div className="text-4xl mb-4">📅</div>
                    <div className="text-slate-300">No matches scheduled yet</div>
                    <div className="text-slate-500 text-sm">Matches will appear once the tournament starts</div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        ) : (
          <div>
            {/* Tournament List */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Select a Tournament</h2>
            </div>

            {tournaments.length === 0 ? (
              <Card className="max-w-md mx-auto bg-slate-800 border-slate-700">
                <CardContent className="text-center py-8">
                  <div className="text-4xl mb-4">🏸</div>
                  <div className="text-slate-300">No tournaments available</div>
                  <div className="text-slate-500 text-sm">Check back later for upcoming tournaments</div>
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
                        {tournament.matches && tournament.matches.length > 0 && (
                          <div>Completed: {tournament.matches.filter(m => m.status === 'completed').length}/{tournament.matches.length}</div>
                        )}
                      </div>
                      <Button 
                        onClick={() => setSelectedTournament(tournament)}
                        className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0"
                        disabled={!tournament.matches || tournament.matches.length === 0}
                      >
                        {tournament.matches && tournament.matches.length > 0 ? 'View Tournament' : 'No Schedule Yet'}
                      </Button>
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