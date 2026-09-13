import mongoose from 'mongoose';

export interface ITeam {
  name: string;
  players: string[];
}

export interface IMatch {
  team1Index: number;
  team2Index: number;
  court?: number;
  timeSlot: number;
  team1Score?: number;
  team2Score?: number;
  status: 'scheduled' | 'in-progress' | 'completed';
  // Championship-groups extra fields
  phase?: 'group' | 'gold_knockout' | 'silver_knockout' | 'bronze_knockout';
  groupIndex?: number;
  bracketMatchId?: string;
  round?: string;
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

export interface IRegistration {
  _id: mongoose.Types.ObjectId;
  teamName: string;
  players: string[];          // kept for backward compat; derived from player1Name + player2Name
  contactEmail: string;
  contactPhone?: string;
  status: 'pending' | 'accepted' | 'waitlisted' | 'rejected' | 'withdrawn';
  appliedAt: Date;
  reviewedAt?: Date;
  notes?: string;
  // Player portal linking
  player1SupabaseId?: string;
  player1Name?: string;
  player1Email?: string;
  player2SupabaseId?: string;
  player2Name?: string;
  player2Email?: string;
  partnerStatus?: 'none' | 'requested' | 'confirmed';
  inviteToken?: string;
  inviteTokenExpiry?: Date;
}

export interface IGroup {
  _id: mongoose.Types.ObjectId;
  name: string;
  sequence: number;
  teamIndices: number[];
}

export interface IQualificationEntry {
  groupId: mongoose.Types.ObjectId;
  groupName: string;
  rank: number;
  teamIndex: number;
  teamName: string;
  championship: 'gold' | 'silver' | 'bronze';
}

export interface IBracketMatch {
  _id: mongoose.Types.ObjectId;
  championship: 'gold' | 'silver' | 'bronze';
  round: 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'final';
  sequence: number;
  team1Index?: number;
  team2Index?: number;
  team1Score?: number;
  team2Score?: number;
  winnerIndex?: number;
  status: 'scheduled' | 'in-progress' | 'completed';
  nextMatchId?: mongoose.Types.ObjectId;
  nextSlot?: 1 | 2;
  court?: number;
  timeSlot?: number;
  matchIndex?: number;
}

export interface ITournament extends mongoose.Document {
  name: string;
  description?: string;
  numberOfTeams: number;
  tournamentFormat: 'court-based' | 'round-robin' | 'championship-groups';
  numberOfCourts?: number;
  roundsPerOpponent?: number;
  // Championship-groups specific
  maxTeams?: number;
  teamsPerGroup?: number;
  numberOfGroups?: number;
  qualificationRules?: {
    gold: number[];
    silver: number[];
    bronze: number[];
  };
  championshipStatus?: string;
  registrations?: IRegistration[];
  groups?: IGroup[];
  qualificationSnapshot?: IQualificationEntry[];
  bracketMatches?: IBracketMatch[];
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
    required: false,
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
  // Championship-groups extra fields
  phase: {
    type: String,
    enum: ['group', 'gold_knockout', 'silver_knockout', 'bronze_knockout'],
    required: false,
  },
  groupIndex: {
    type: Number,
    required: false,
  },
  bracketMatchId: {
    type: String,
    required: false,
  },
  round: {
    type: String,
    required: false,
  },
});

const RegistrationSchema = new mongoose.Schema({
  teamName: { type: String, required: true, trim: true },
  players: [{ type: String, trim: true }],
  contactEmail: { type: String, required: true, trim: true },
  contactPhone: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'waitlisted', 'rejected', 'withdrawn'],
    default: 'pending',
  },
  appliedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  notes: { type: String, trim: true },
  // Player portal fields
  player1SupabaseId: { type: String },
  player1Name: { type: String, trim: true },
  player1Email: { type: String, trim: true },
  player2SupabaseId: { type: String },
  player2Name: { type: String, trim: true },
  player2Email: { type: String, trim: true },
  partnerStatus: {
    type: String,
    enum: ['none', 'requested', 'confirmed'],
    default: 'none',
  },
  inviteToken: { type: String },          // one-time token for email accept/decline
  inviteTokenExpiry: { type: Date },
});

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sequence: { type: Number, required: true },
  teamIndices: [{ type: Number }],
});

const QualificationEntrySchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId },
  groupName: { type: String },
  rank: { type: Number },
  teamIndex: { type: Number },
  teamName: { type: String },
  championship: { type: String, enum: ['gold', 'silver', 'bronze'] },
});

const BracketMatchSchema = new mongoose.Schema({
  championship: { type: String, enum: ['gold', 'silver', 'bronze'], required: true },
  round: {
    type: String,
    enum: ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'],
    required: true,
  },
  sequence: { type: Number, required: true },
  team1Index: { type: Number },
  team2Index: { type: Number },
  team1Score: { type: Number, min: 0 },
  team2Score: { type: Number, min: 0 },
  winnerIndex: { type: Number },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed'],
    default: 'scheduled',
  },
  nextMatchId: { type: mongoose.Schema.Types.ObjectId },
  nextSlot: { type: Number, enum: [1, 2] },
  court: { type: Number },
  timeSlot: { type: Number },
  matchIndex: { type: Number },
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
    min: [0, 'Minimum 0 teams'],
    max: [512, 'Maximum 512 teams allowed'],
  },
  tournamentFormat: {
    type: String,
    enum: ['court-based', 'round-robin', 'championship-groups'],
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
  // Championship-groups specific fields
  maxTeams: { type: Number, required: false },
  teamsPerGroup: { type: Number, required: false },
  numberOfGroups: { type: Number, required: false },
  qualificationRules: {
    type: {
      gold: [Number],
      silver: [Number],
      bronze: [Number],
    },
    required: false,
  },
  championshipStatus: { type: String, required: false },
  registrations: { type: [RegistrationSchema], required: false, default: undefined },
  groups: { type: [GroupSchema], required: false, default: undefined },
  qualificationSnapshot: { type: [QualificationEntrySchema], required: false, default: undefined },
  bracketMatches: { type: [BracketMatchSchema], required: false, default: undefined },
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
