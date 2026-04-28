import mongoose, { Document } from "mongoose";

export interface BidTemplateDocument extends Document {
  id: string;
  userId: mongoose.Types.ObjectId | string;
  telegramId: number;
  role: string;
  prompt: string;
  template: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BidTemplateSchema = new mongoose.Schema<BidTemplateDocument>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    telegramId: { type: Number, required: true },
    role: { type: String, required: true },
    prompt: { type: String, required: true },
    template: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<BidTemplateDocument>("bidTemplates", BidTemplateSchema);

