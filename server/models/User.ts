import mongoose, { Document } from "mongoose";

export interface UserDocument extends Document {
  id: string;
  telegramId: number;
  telegramUsername?: string;
  email?: string;
  password?: string;
  cw_pass?: string;
  fullName: string;
  age?: number;
  birthday?: string;
  avatarUrl?: string;
  role: string;
  status: number | string;
  auth_token?: string;
  cookie?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<UserDocument>(
  {
    id: { type: String, required: true, unique: true },
    telegramId: { type: Number, required: true, unique: true },
    telegramUsername: { type: String },
    email: { type: String },
    password: { type: String },
    cw_pass: String,
    fullName: { type: String },
    age: { type: Number },
    birthday: { type: String },
    avatarUrl: { type: String },
    role: { type: String, default: "user" },
    status: { type: mongoose.Schema.Types.Mixed, required: true, default: 0 },
    auth_token: { type: String },
    cookie: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);


export default mongoose.model<UserDocument>("users", UserSchema);

