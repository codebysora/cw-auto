import JobType from "@Server/types/job";
import mongoose, { Model, Document } from "mongoose";

const JobSchema = new mongoose.Schema<JobType>(
  {
    id: { type: Number, default: 0 },
    categoryId: { type: Number, default: 0 },
    title: { type: String, default: "" },
    desc: { type: String, default: "" },
    jobType: { type: String, enum: ['fixed', 'hourly'], default: "fixed" },
    lowBudget: { type: Number, default: 0 },
    highBudget: { type: Number, default: 0 },
    suggestions: { type: Number, default: 0 },
    deadline: { type: String, default: "" },
    postedDate: { type: String, default: "" },
    clientId: { type: Number, default: 0 },
    clientName: { type: String, default: "" },
    clientAvatar: { type: String, default: "" },
    bidders: { type: [Number], default: [] },
  },
  {
    timestamps: true,
  },
);

const Job = mongoose.model("jobs", JobSchema);

export default Job;
