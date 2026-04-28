import mongoose, { Document } from "mongoose";

export interface CwProfileDocument extends Document {
  id: string;
  userId: mongoose.Schema.Types.ObjectId;
  telegramId: number;
  cwEmail: string;
  cwPassword: string;
  accountId?: string;
  accountLink?: string;
  profileDescription?: string; // User's own profile description
  isPrimary: boolean;
  auth_token?: string;
  cookie?: string;
  lastAuthAt?: Date;
  authStatus: boolean;
  createdAt: Date;
}

const CwProfileSchema = new mongoose.Schema<CwProfileDocument>(
  {
    id: { type: String, required: true, unique: true },
    telegramId: { type: Number, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, ref: "users" },
    cwEmail: { type: String, required: true },
    cwPassword: { type: String, required: true },
    accountId: { type: String },
    accountLink: { type: String },
    profileDescription: { type: String }, // User's own profile description
    isPrimary: { type: Boolean, default: true }, // Always true since only one profile per user
    auth_token: { type: String },
    cookie: { type: String },
    lastAuthAt: { type: Date },
    authStatus: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<CwProfileDocument>("cwProfiles", CwProfileSchema);

