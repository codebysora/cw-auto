import AutoBidScheduleModel from "../models/AutoBidSchedule";
import { InsertAutoBidSchedule } from "@shared/schema";
import { randomUUID } from "crypto";
import UserModel from "../models/User";

export const getAutoBidSchedule = async (telegramId: number) => {
  const user = await UserModel.findOne({ telegramId });
  if (!user) {
    const error: any = new Error("User not found");
    return {
      success: false,
      error: error.message,
      status: 404,
    };
  }
  const schedule = await AutoBidScheduleModel.findOne({ userId: user._id, telegramId: Number(telegramId) }).lean();
  if (!schedule) {
    const error: any = new Error("Schedule not found");
    return {
      success: false,
      error: error.message,
      status: 404,
    };
  }
  return {
    success: true,
    schedule: schedule,
  };
};

export const getAutoBidScheduleById = async (id: string) => {
  const schedule = await AutoBidScheduleModel.findOne({ id }).lean();
  if (!schedule) {
    throw new Error("Schedule not found");
  }
  return schedule;
};

export const createAutoBidSchedule = async (telegramId: number, data: InsertAutoBidSchedule) => {
  const user = await UserModel.findOne({ telegramId });
  if (!user) {
    throw new Error("User not found");
  }
  const id = randomUUID();
  const schedule = new AutoBidScheduleModel({ ...data, id, userId: user._id, telegramId, createdAt: new Date() });
  const savedSchedule = await schedule.save();
  return savedSchedule.toObject();
};

export const updateAutoBidSchedule = async (id: string, updates: Partial<InsertAutoBidSchedule>) => {
  const schedule = await AutoBidScheduleModel.findOneAndUpdate(
    { id },
    updates,
    { new: true }
  ).lean();
  if (!schedule) {
    throw new Error("Schedule not found");
  }
  return schedule;
};

export const deleteAutoBidSchedule = async (id: string) => {
  const result = await AutoBidScheduleModel.deleteOne({ id });
  if (result.deletedCount === 0) {
    throw new Error("Schedule not found");
  }
  return { success: true };
};

export const createOrUpdateAutoBidSchedule = async (telegramId: number, data: InsertAutoBidSchedule) => {
  const existing = await AutoBidScheduleModel.findOne({ telegramId });
  if (existing) {
    return await updateAutoBidSchedule(existing.id, data);
  }
  return await createAutoBidSchedule(telegramId, data);
};

export const getAllAutoBidSchedules = async () => {
  return await AutoBidScheduleModel.find().lean();
};

