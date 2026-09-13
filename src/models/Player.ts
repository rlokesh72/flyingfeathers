import mongoose from 'mongoose';

export interface IPlayer extends mongoose.Document {
  supabaseId: string;       // Supabase auth user id
  email: string;
  name: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'competitive';
  yearsOfExperience?: number;
  preferredHand?: 'left' | 'right' | 'ambidextrous';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  avatarUrl?: string;
  onboardingCompleted: boolean;
  createdAt: Date;
}

const PlayerSchema = new mongoose.Schema({
  supabaseId: { type: String, required: true, unique: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'prefer_not_to_say'] },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'competitive'],
  },
  yearsOfExperience: { type: Number, min: 0, max: 50 },
  preferredHand: { type: String, enum: ['left', 'right', 'ambidextrous'] },
  emergencyContactName: { type: String },
  emergencyContactPhone: { type: String },
  avatarUrl: { type: String },
  onboardingCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Player ||
  mongoose.model<IPlayer>('Player', PlayerSchema);
