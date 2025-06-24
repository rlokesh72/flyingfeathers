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

export default function SchedulesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments');
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
                  <Button 
                    onClick={() => setSelectedTournament(null)}
                    className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white border-0"
                  >
                    Back to Tournament List
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Match Schedule */}
            {selectedTournament.matches.length > 0 ? (
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
                        {tournament.matches && tournament.matches.length > 0 ? 'View Schedule' : 'No Schedule Yet'}
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