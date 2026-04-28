import AnalyticsModel from "@Server/models/Analytics";
import { InsertAnalytics } from "@shared/schema";
import BidHistoryModel from "@Server/models/BidHistory";

import { randomUUID } from "crypto";

export const getAnalytics = async (data: { telegramId: string, date: string }) => {
  const { telegramId, date } = data;

  // Handle different date filters based on analytics.tsx values:
  let dateFilter: any = {};
  const now = new Date();
  switch (date) {
    case "today":
      {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        dateFilter = { date: { $gte: start, $lt: end } };
      }
      break;
    case "this_week":
      {
        const day = now.getDay();
        console.log(day, 'day');
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
        const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        dateFilter = { date: { $gte: weekStart, $lt: weekEnd } };
      }
      break;
    case "this_month":
      {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        dateFilter = { date: { $gte: start, $lt: end } };
      }
      break;
    case "this_year":
      {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear() + 1, 0, 1);
        dateFilter = { date: { $gte: start, $lt: end } };
      }
      break;
    case "all_time":
      // No date filter
      dateFilter = {};
      break;
    case "custom":
      // Not implemented, so fall through to all_time for now
      dateFilter = {};
      break;
    default:
      // fallback, treat as all_time
      dateFilter = {};
      break;
  }

  const bidHistory = await BidHistoryModel.find({ telegramId, ...dateFilter }).lean();

  if (!bidHistory) {
    return {
      success: false,
      error: "Bid history not found",
      status: 404,
    };
  }

  
  return { success: true, bidHistory };
};

export const createAnalytics = async (data: InsertAnalytics) => {
  const id = randomUUID();
  const analytics = new AnalyticsModel({ ...data, id });
  const savedAnalytics = await analytics.save();
  return savedAnalytics.toObject();
};

export const updateAnalytics = async (id: string, updates: Partial<InsertAnalytics>) => {
  const analytics = await AnalyticsModel.findOneAndUpdate(
    { id },
    updates,
    { new: true }
  ).lean();
  if (!analytics) {
    throw new Error("Analytics not found");
  }
  return analytics;
};

export const getAllAnalytics = async () => {
  return await AnalyticsModel.find({}).lean();
};

export const createOrUpdateAnalytics = async (userId: string, date: string, data: InsertAnalytics) => {
  const existing = await AnalyticsModel.findOne({ userId, date });
  if (existing) {
    return await updateAnalytics(existing.id, data);
  }
  return await createAnalytics(data);
};

