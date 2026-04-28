import mongoose, { Document } from "mongoose";

export interface AnalyticsDocument extends Document {
  id: string;
  userId: string;
  date: string;
  bidCount: number;
  messageCount: number;
  contactCount: number;
  jobsPosted: number;
}

const AnalyticsSchema = new mongoose.Schema<AnalyticsDocument>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    date: { type: String, required: true },
    bidCount: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    contactCount: { type: Number, default: 0 },
    jobsPosted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<AnalyticsDocument>("analytics", AnalyticsSchema);

