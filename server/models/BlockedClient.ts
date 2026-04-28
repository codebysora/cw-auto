import mongoose, { Document } from "mongoose";

export interface BlockedClientDocument extends Document {
  clientId: number;
  createdAt: Date;
}

const BlockedClientSchema = new mongoose.Schema<BlockedClientDocument>(
  {
    clientId: { type: Number, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<BlockedClientDocument>("blocked_clients", BlockedClientSchema);
