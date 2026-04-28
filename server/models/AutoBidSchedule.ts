import mongoose, { Document } from "mongoose";

export interface AutoBidScheduleDocument extends Document {
  id: string;
  userId: mongoose.Schema.Types.ObjectId;
  telegramId: number;
  isActive: boolean;
  daysOfWeek: string[];
  timeRangeStart?: string;
  timeRangeEnd?: string;
  startDate?: string;
  endDate?: string;
  // Project type/category for targeting
  projectType?: string;
  // Fixed budget settings
  fixedBudgetLevel: 'low' | 'medium' | 'high' | 'custom';
  fixedBudgetMin?: number;
  fixedBudgetMax?: number;
  // Hourly budget settings
  hourlyBudgetLevel: 'low' | 'medium' | 'high' | 'custom';
  hourlyBudgetMin?: number;
  hourlyBudgetMax?: number;
  // Client budget preferences
  clientBudgetPreference: 'low' | 'high';
  // Preferred hourly budget when no budget range in client post
  preferredHourlyBudget: number;
  // Preferred hours limit when bidding hourly
  hoursLimit?: number;
  // Preferred roles (up to 2)
  preferredRoles?: string[];
  createdAt: Date;
}

const AutoBidScheduleSchema = new mongoose.Schema<AutoBidScheduleDocument>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'users' },
    telegramId: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    daysOfWeek: [String],
    timeRangeStart: String,
    timeRangeEnd: String,
    startDate: String,
    endDate: String,
    // Project type/category for targeting
    projectType: String,
    // Fixed budget settings
    fixedBudgetLevel: { type: String, enum: ['low', 'medium', 'high', 'custom'], required: true },
    fixedBudgetMin: Number,
    fixedBudgetMax: Number,
    // Hourly budget settings
    hourlyBudgetLevel: { type: String, enum: ['low', 'medium', 'high', 'custom'], required: true },
    hourlyBudgetMin: Number,
    hourlyBudgetMax: Number,
    // Client budget preferences
    clientBudgetPreference: { type: String, enum: ['low', 'high'], required: true },
    // Preferred hourly budget when no budget range in client post
    preferredHourlyBudget: { type: Number, required: true },
    // Preferred hours limit when bidding hourly
    hoursLimit: Number,
    // Preferred roles (up to 2)
    preferredRoles: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<AutoBidScheduleDocument>("autoBidSchedules", AutoBidScheduleSchema);

