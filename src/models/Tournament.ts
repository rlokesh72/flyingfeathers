import mongoose from 'mongoose';

export interface ITeam {
  name: string;
  players: string[];
}

export interface IMatch {
  team1Index: number;
  team2Index: number;
  court?: number; // Optional for round-robin format
  timeSlot: number;
  team1Score?: number;
  team2Score?: number;
  status: 'scheduled' | 'in-progress' | 'completed';
}

export interface ITeamStats {
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

export interface ITournament extends mongoose.Document {
  name: string;
  description?: string;
  numberOfTeams: number;
  tournamentFormat: 'court-based' | 'round-robin';
  numberOfCourts?: number; // Optional for court-based
  roundsPerOpponent?: number; // Optional for round-robin
  teams: ITeam[];
  matches: IMatch[];
  scheduledDate: Date;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed';
  standings?: ITeamStats[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
  },
  players: [{
    type: String,
    trim: true,
  }],
});

const MatchSchema = new mongoose.Schema({
  team1Index: {
    type: Number,
    required: true,
  },
  team2Index: {
    type: Number,
    required: true,
  },
  court: {
    type: Number,
    required: false, // Optional for round-robin format
  },
  timeSlot: {
    type: Number,
    required: true,
  },
  team1Score: {
    type: Number,
    min: 0,
  },
  team2Score: {
    type: Number,
    min: 0,
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed'],
    default: 'scheduled',
  },
});

const TournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tournament name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  numberOfTeams: {
    type: Number,
    required: [true, 'Number of teams is required'],
    min: [2, 'Minimum 2 teams required'],
    max: [12, 'Maximum 12 teams allowed'],
  },
  tournamentFormat: {
    type: String,
    enum: ['court-based', 'round-robin'],
    default: 'court-based',
    required: true,
  },
  numberOfCourts: {
    type: Number,
    min: [1, 'Minimum 1 court required'],
    max: [10, 'Maximum 10 courts allowed'],
    required: function(this: any) {
      return this.tournamentFormat === 'court-based';
    },
  },
  roundsPerOpponent: {
    type: Number,
    min: [1, 'Minimum 1 round required'],
    max: [5, 'Maximum 5 rounds allowed'],
    required: function(this: any) {
      return this.tournamentFormat === 'round-robin';
    },
  },
  teams: [TeamSchema],
  matches: [MatchSchema],
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed'],
    default: 'scheduled',
  },
  standings: [{
    teamIndex: Number,
    teamName: String,
    players: [String],
    wins: Number,
    losses: Number,
    pointsFor: Number,
    pointsAgainst: Number,
    pointDifference: Number,
    matchesPlayed: Number,
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Clear the model if it exists to ensure we use the latest schema
if (mongoose.models.Tournament) {
  delete mongoose.models.Tournament;
}

export default mongoose.model<ITournament>('Tournament', TournamentSchema); 