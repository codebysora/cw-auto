import BidTemplateModel from "../models/BidTemplate";
import UserModel from "../models/User";
import { InsertBidTemplate } from "@shared/schema";
import { randomUUID } from "crypto";

export const getBidTemplates = async (telegramId: number) => {
  const user = await UserModel.findOne({ telegramId: Number(telegramId) });
  if (!user) {
    throw new Error("User not found");
  }
  const templates = await BidTemplateModel.find({ userId: user._id }).lean();
  // If no templates exist for the user, create a default template automatically
  if (!templates || templates.length === 0) {
    const id = randomUUID();
    const defaultTemplate = {
      id,
      userId: user._id,
      telegramId: user.telegramId,
      role: "general-bid-template",
      prompt: "default",
      template:
        "こんにちは！\n\nプロジェクトの詳細を拝見いたしました。\n\n私の経験とスキルを活かして、高品質な成果物をお届けできると確信しております。\n\nご質問やご相談がございましたら、お気軽にお声かけください。\n\nよろしくお願いいたします。",
      isActive: true,
      createdAt: new Date(),
    };
    const createdTemplate = await BidTemplateModel.create(defaultTemplate);
    return [createdTemplate.toObject()];
  }
  return templates;
};

export const getBidTemplateById = async (id: string) => {
  const template = await BidTemplateModel.findOne({ id }).lean();
  if (!template) {
    throw new Error("Template not found");
  }
  return template;
};

export const createBidTemplate = async (telegramId: number, data: InsertBidTemplate) => {
  const id = randomUUID();
  const user = await UserModel.findOne({ telegramId: Number(telegramId) });
  if (!user) {
    throw new Error("User not found");
  }
  const template = new BidTemplateModel({ ...data, id, userId: user._id, telegramId, createdAt: new Date() });
  const savedTemplate = await template.save();
  return savedTemplate.toObject();
};

export const updateBidTemplate = async (id: string, updates: Partial<InsertBidTemplate>) => {
  const template = await BidTemplateModel.findOneAndUpdate(
    { id },
    updates,
    { new: true }
  ).lean();
  if (!template) {
    throw new Error("Template not found");
  }
  return template;
};

export const deleteBidTemplate = async (id: string) => {
  const result = await BidTemplateModel.deleteOne({ id });
  if (result.deletedCount === 0) {
    throw new Error("Template not found");
  }
  return { success: true, message: "Template deleted successfully" };
};

