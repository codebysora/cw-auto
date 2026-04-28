import mongoose, { Document, Types } from "mongoose";

// Types
export interface SingleBid {
    jobId: number;
    categoryId: number;
    bidText: string;
    jobType: 'fixed' | 'hourly';
    budget?: number;
    contract?: number;
    chat?: number;
}

export interface BidHistoryDocument extends Document {
    user: Types.ObjectId;
    telegramId: number;
    date: Date;
    bids: SingleBid[];
}

const SingleBidSchema = new mongoose.Schema<SingleBid>(
    {
        jobId: { type: Number, required: true },
        categoryId: { type: Number, default: 0 },
        bidText: { type: String, required: true },
        jobType: { type: String, enum: ['fixed', 'hourly'] },
        budget: { type: Number },
        contract: { type: Number, default: 0 },
        chat: { type: Number, default: 0 },
    },
    { _id: false }
);

const bidHistorySchema = new mongoose.Schema<BidHistoryDocument>(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
        telegramId: { type: Number, required: true },
        date: {
            type: Date,
            default: Date.now,
        },
        bids: [SingleBidSchema]
    }
);

export default mongoose.model<BidHistoryDocument>("bids", bidHistorySchema);

