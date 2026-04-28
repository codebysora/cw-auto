import BidHistoryModel, { SingleBid } from "../models/BidHistory";
import UserModel from "../models/User";
import { Types } from "mongoose";

export const getBidHistories = async (userId: string) => {
  // Get user by id to get MongoDB _id
  const user = await UserModel.findOne({ id: userId });
  if (!user) throw new Error("User not found");

  return await BidHistoryModel.find({ user: user._id }).populate('bids.job').lean();
};

export const getBidHistoryByDate = async (userId: string, date: Date) => {
  // Get user by id to get MongoDB _id
  const user = await UserModel.findOne({ id: userId });
  if (!user) throw new Error("User not found");

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await BidHistoryModel.findOne({
    user: user._id,
    date: { $gte: startOfDay, $lte: endOfDay }
  }).populate('bids.job').lean();
};

export const addBidToDay = async (telegramId: number, date: Date, bid: SingleBid) => {
  // Get user by id to get MongoDB _id
  const user = await UserModel.findOne({ telegramId });
  if (!user) throw new Error("User not found");

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  let bidDoc = await BidHistoryModel.findOne({
    telegramId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });
  if (!bidDoc) {
    // Create new document for this day
    bidDoc = new BidHistoryModel({
      user: user._id,
      telegramId,
      date: startOfDay,
      bids: [bid]
    });
  } else {
    // Add bid to existing document
    bidDoc.bids.push(bid);
  }

  const savedDoc = await bidDoc.save();
  return savedDoc.populate('bids.jobId').then((doc: any) => doc.toObject());
};

export const createOrUpdateBidDay = async (userId: string, date: Date, bids: SingleBid[]) => {
  // Get user by id to get MongoDB _id
  const user = await UserModel.findOne({ id: userId });
  if (!user) throw new Error("User not found");

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  let bidDoc = await BidHistoryModel.findOne({
    user: user._id,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (!bidDoc) {
    bidDoc = new BidHistoryModel({
      user: user._id,
      date: startOfDay,
      bids
    });
  } else {
    bidDoc.bids = bids;
  }

  const savedDoc = await bidDoc.save();
  return savedDoc.populate('bids.jobId').then((doc: any) => doc.toObject());
};

export const deleteBidDay = async (userId: string, date: Date) => {
  // Get user by id to get MongoDB _id
  const user = await UserModel.findOne({ id: userId });
  if (!user) throw new Error("User not found");

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await BidHistoryModel.deleteOne({ user: user._id, date: { $gte: startOfDay, $lte: endOfDay } });

  if (result.deletedCount === 0) {
    throw new Error("Bid day not found");
  }
  return { success: true };
};
