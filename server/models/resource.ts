import JobType from "@Server/types/job";
import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        prompt: [
            {
                prompt: { type: String, required: true },
                used: { type: Boolean, default: false }
            }
        ],
        bid_temp: [
            {
                prompt: { type: String, required: true },
                used: { type: Boolean, default: false }
            }
        ],
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<Document & JobType>("resource", resourceSchema);
