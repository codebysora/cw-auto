import PastWorkModel from "../models/PastWork";
import { randomUUID } from "crypto";

export interface PastWorkData {
  category: string;
  role: string;
  projectUrl: string;
  description: string;
  isActive: boolean;
}

export async function getPastWorkByTelegramId(telegramId: number) {
  try {
    return await PastWorkModel.find({ telegramId }).lean();
  } catch (error) {
    console.error("Error fetching past work:", error);
    throw new Error("Failed to fetch past work");
  }
}

export async function getPastWorkById(telegramId: number, id: string) {
  try {
    const result = await PastWorkModel.findOne({ id, telegramId }).lean();
    return result;
  } catch (error) {
    console.error("Error fetching past work by ID:", error);
    throw new Error("Failed to fetch past work");
  }
}

export async function createPastWork(telegramId: number, data: PastWorkData) {
  try {
    console.log(data, "data");
    const id = randomUUID();
    const pastWork = new PastWorkModel({
      ...data,
      id,
      telegramId,
      isActive: data.isActive ?? true,
    });

    const savedPastWork = await pastWork.save();
    return savedPastWork.toObject();
  } catch (error) {
    console.error("Error creating past work:", error);
    throw new Error("Failed to create past work");
  }
}

export async function updatePastWork(telegramId: number, id: string, data: Partial<PastWorkData>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const updatedPastWork = await PastWorkModel.findOneAndUpdate(
      { id, telegramId },
      updateData,
      { new: true }
    );

    if (!updatedPastWork) {
      throw new Error("Past work not found");
    }

    return updatedPastWork.toObject();
  } catch (error) {
    console.error("Error updating past work:", error);
    throw new Error("Failed to update past work");
  }
}

export async function deletePastWork(telegramId: number, id: string) {
  try {
    const result = await PastWorkModel.deleteOne({ id, telegramId });
    if (result.deletedCount === 0) {
      throw new Error("Past work not found");
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting past work:", error);
    throw new Error("Failed to delete past work");
  }
}
