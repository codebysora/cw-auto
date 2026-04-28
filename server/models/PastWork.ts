import mongoose, { Schema, Document } from "mongoose";

export interface IPastWork extends Document {
  id: string;
  telegramId: number;
  category: string; // category name: website development, mobile app development, etc.
  role: string; // role name: 2,17,364,365,283,366, etc.
  projectUrl: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PastWorkSchema = new Schema<IPastWork>({
  id: { type: String, required: true, unique: true },
  telegramId: { type: Number, required: true },
  category: { type: String, required: true },
  role: { type: String, required: true },
  projectUrl: { type: String, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
PastWorkSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IPastWork>("PastWork", PastWorkSchema);