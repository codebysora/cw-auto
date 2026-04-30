import CwProfileModel from "../models/CwProfile";
import { InsertCwProfile } from "@shared/schema";
import { randomUUID } from "crypto";
import { authenticateCrowdworks } from "./authController";
import UserModel from "../models/User";
import mongoose from "mongoose";

function pickNonEmptyString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

/** Merge camelCase + snake_case account fields; drop telegramId so PATCH cannot overwrite the indexed telegramId in Mongo. */
export function normalizeCwProfileUpdates(updates: Record<string, unknown>): Partial<InsertCwProfile> {
  const { telegramId: _omitTelegram, ...rest } = updates;
  const accountId =
    pickNonEmptyString(rest.accountId) ?? pickNonEmptyString(rest.account_id);
  const accountLink =
    pickNonEmptyString(rest.accountLink) ?? pickNonEmptyString(rest.account_link);

  const merged = { ...rest } as Record<string, unknown>;
  delete merged.account_id;
  delete merged.account_link;

  if (accountId !== undefined) merged.accountId = accountId;
  if (accountLink !== undefined) merged.accountLink = accountLink;

  return merged as Partial<InsertCwProfile>;
}

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
  const clean = normalizeCwProfileUpdates(updates as Record<string, unknown>);

  // If password is being updated, re-authenticate
  if (clean.cwPassword) {
    const existingProfile = await CwProfileModel.findOne({ telegramId });
    if (!existingProfile) {
      throw new Error("Profile not found");
    }

    // Use updated email when provided, otherwise keep existing one.
    const emailForAuth = (clean.cwEmail && clean.cwEmail.trim())
      ? clean.cwEmail.trim()
      : existingProfile.cwEmail;
    const authResult = await authenticateCrowdworks(emailForAuth, clean.cwPassword);

    const updateData = {
      ...clean,
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
    ...clean,
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
