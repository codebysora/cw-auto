import PromptModel from "../models/Prompt";
import { randomUUID } from "crypto";

export const getPromptsByTelegramId = async (telegramId: number) => {
  // First find the user to get their MongoDB _id
  const UserModel = (await import("../models/User")).default;
  const user = await UserModel.findOne({ telegramId: Number(telegramId) });
  if (!user) {
    throw new Error("User not found");
  }

  const prompts = await PromptModel.find({ userId: user._id }).lean();
  // If no prompts found, create a default prompt for the user.
  if (!prompts || prompts.length === 0) {
    // Create a default prompt for the user
    const id = randomUUID();
    const defaultPrompt = {
      id,
      userId: user._id,
      telegramId: user.telegramId,
      name: "Default Bid Prompt",
      description: "A general-purpose prompt for creating bid messages",
      prompt: "Create a professional and compelling bid message for the following project. The message should be polite, highlight relevant experience, and express enthusiasm for the project. Keep it concise but informative.",
      category: "default",
      isActive: true,
    };
    const createdPrompt = await PromptModel.create(defaultPrompt);
    return [createdPrompt.toObject()];
  }
  return prompts;
};

export const createPrompt = async (telegramId: number, promptData: {
  name: string;
  description?: string;
  prompt: string;
  category: string;
  isActive?: boolean;
}) => {
  // First find the user to get their MongoDB _id
  const UserModel = (await import("../models/User")).default;
  const user = await UserModel.findOne({ telegramId: Number(telegramId) });
  if (!user) {
    throw new Error("User not found");
  }

  const id = randomUUID();
  const prompt = new PromptModel({
    ...promptData,
    id,
    userId: user._id,
    telegramId,
    isActive: promptData.isActive ?? false,
  });

  const savedPrompt = await prompt.save();
  return savedPrompt.toObject();
};

export const updatePrompt = async (telegramId: number, promptId: string, promptData: {
  name?: string;
  description?: string;
  prompt?: string;
  category?: string;
  isActive?: boolean;
}) => {
  // First find the user to get their MongoDB _id
  const UserModel = (await import("../models/User")).default;
  const user = await UserModel.findOne({ telegramId });
  if (!user) {
    throw new Error("User not found");
  }

  const updatedPrompt = await PromptModel.findOneAndUpdate(
    { id: promptId, userId: user._id },
    { ...promptData, updatedAt: new Date() },
    { new: true }
  );

  if (!updatedPrompt) {
    throw new Error("Prompt not found");
  }

  return updatedPrompt.toObject();
};

export const deletePrompt = async (telegramId: number, promptId: string) => {
  // First find the user to get their MongoDB _id
  const UserModel = (await import("../models/User")).default;
  const user = await UserModel.findOne({ telegramId });
  if (!user) {
    throw new Error("User not found");
  }

  const result = await PromptModel.deleteOne({ id: promptId, userId: user._id });
  if (result.deletedCount === 0) {
    throw new Error("Prompt not found");
  }

  return { success: true };
};

export const getPromptById = async (telegramId: number, promptId: string) => {
  // First find the user to get their MongoDB _id
  const UserModel = (await import("../models/User")).default;
  const user = await UserModel.findOne({ telegramId });
  if (!user) {
    throw new Error("User not found");
  }

  const prompt = await PromptModel.findOne({ telegramId, id: promptId }).lean();
  if (!prompt) {
    throw new Error("Prompt not found");
  }

  return prompt;
};
