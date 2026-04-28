import mongoose, { Document } from "mongoose";

export interface PromptDocument extends Document {
  id: string;
  userId: mongoose.Types.ObjectId | string;
  telegramId: number;
  name: string;
  description?: string;
  prompt: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromptSchema = new mongoose.Schema<PromptDocument>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    telegramId: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String },
    prompt: { type: String, required: true },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<PromptDocument>("prompts", PromptSchema);
