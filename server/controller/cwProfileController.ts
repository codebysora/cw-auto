import CwProfileModel from "../models/CwProfile";
import { InsertCwProfile } from "@shared/schema";
import { randomUUID } from "crypto";
import { authenticateCrowdworks } from "./authController";
import UserModel from "../models/User";
import mongoose from "mongoose";

export const getCwProfiles = async (telegramId: number) => {
  const profile = await CwProfileModel.findOne({ telegramId }).lean();
  return profile ? [profile] : []; // Return array with single profile or empty array
};

export const getCwProfile = async (telegramId: number) => {
  return await CwProfileModel.findOne({ telegramId }).lean();
};

export const getCwProfileById = async (id: string) => {
  const profile = await CwProfileModel.findOne({ id }).lean();
  if (!profile) {
    throw new Error("Profile not found");
  }
  return profile;
};

export const createCwProfile = async (telegramId: number, data: InsertCwProfile) => {
  // Check if user already has a profile
  const existingProfile = await CwProfileModel.findOne({ telegramId });
  if (existingProfile) {
    throw new Error("User already has a Crowdworks profile. Only one profile per user is allowed.");
  }

  const user = await UserModel.findOne({ telegramId });
  if (!user) {
    throw new Error("User not found");
  }

  const userId = user._id;

  const id = randomUUID();

  // Authenticate with Crowdworks to get auth token and cookie
  const authResult = await authenticateCrowdworks(data.cwEmail, data.cwPassword);

  const profileData = {
    ...data,
    id,
    telegramId,
    userId: userId as mongoose.Types.ObjectId,
    createdAt: new Date(),
    isPrimary: true, // Always true since only one profile per user
    auth_token: authResult.auth_token || null,
    cookie: authResult.cookie || null,
    lastAuthAt: authResult.success ? new Date() : null,
    authStatus: (authResult.auth_token != null && authResult.cookie != null),
  };

  const profile = new CwProfileModel(profileData);
  const savedProfile = await profile.save();
  return { ...savedProfile.toObject(), authMessage: authResult.message };
};

export const updateCwProfile = async (telegramId: number, updates: Partial<InsertCwProfile>) => {
  // If password is being updated, re-authenticate
  if (updates.cwPassword) {
    const existingProfile = await CwProfileModel.findOne({ telegramId });
    if (!existingProfile) {
      throw new Error("Profile not found");
    }

    // Use updated email when provided, otherwise keep existing one.
    const emailForAuth = (updates.cwEmail && updates.cwEmail.trim())
      ? updates.cwEmail.trim()
      : existingProfile.cwEmail;
    const authResult = await authenticateCrowdworks(emailForAuth, updates.cwPassword);

  const updateData = {
    ...updates,
    auth_token: authResult.auth_token || null,
    cookie: authResult.cookie || null,
    lastAuthAt: authResult.success ? new Date() : null,
    authStatus: (authResult.auth_token != null && authResult.cookie != null),
  };

  const profile = await CwProfileModel.findOneAndUpdate(
    { telegramId },
    updateData,
    { new: true }
  ).lean();

  if (!profile) {
    throw new Error("Profile not found");
  }

  return { ...profile, authMessage: authResult.message };
  }

  // Update non-password fields
  const existingProfile = await CwProfileModel.findOne({ telegramId });
  if (!existingProfile) {
    throw new Error("Profile not found");
  }

  const updateData = {
    ...updates,
    authStatus: (existingProfile.auth_token != null && existingProfile.cookie != null),
  };

  const profile = await CwProfileModel.findOneAndUpdate(
    { telegramId },
    updateData,
    { new: true }
  ).lean();
  if (!profile) {
    throw new Error("Profile not found");
  }

  return profile;
};

export const deleteCwProfile = async (id: string) => {
  const result = await CwProfileModel.deleteOne({ id });
  if (result.deletedCount === 0) {
    throw new Error("Profile not found");
  }
  return { success: true };
};
