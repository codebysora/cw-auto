import UserModel from "../models/User";
import { InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

import { openBrowser, delay } from "@Server/utils";

export interface CwAuthResult {
  success: boolean;
  auth_token?: string;
  cookie?: string;
  message: string;
}



export const saveUserTelegramId = async (telegramId: number): Promise<{ success: boolean; message: string }> => {
  try {
    const existingUser = await UserModel.findOne({ telegramId });

    if (existingUser) {
      return {
        success: true,
        message: "✅ You have already requested access."
      };
    }

    // Create new user with only tg_id
    const currentTime = new Date().toISOString();
    const newUser = new UserModel({
      id: randomUUID(),
      telegramId,
      fullName: `User ${telegramId}`, // Temporary name
      role: "user",
      status: 0, // 0: pending
      createdAt: currentTime,
      updatedAt: currentTime,
    });

    await newUser.save();

    return {
      success: true,
      message: "✅ You have requested access. An admin will review your request."
    };
  } catch (error: any) {
    console.error("Error saving telegram ID:", error);

    // Check if error is due to duplicate key (email conflict)
    if (error.code === 11000) {
      return {
        success: false,
        message: "❌ An error occurred. Please try again later."
      };
    }

    throw error;
  }
};

export const registerUser = async (data: InsertUser) => {
  // Check if user already exists
  const existingUser = await UserModel.findOne({ telegramId: data.telegramId });
  if (existingUser) {
    throw new Error("User with this Telegram ID already exists");
  }

  const id = randomUUID();
  const user = new UserModel({ ...data, id, createdAt: new Date() });
  const savedUser = await user.save();
  return savedUser.toObject();
};

export const loginUser = async (telegramId: string, password: string) => {
  const user = await UserModel.findOne({ telegramId });
  if (!user || user.password !== password) {
    throw new Error("Invalid credentials");
  }
  return user.toObject();
};

export const getUserByTelegramId = async (telegramId: string) => {
  const user = await UserModel.findOne({ telegramId }).lean();
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const updateUser = async (telegramId: string, updates: Partial<InsertUser>) => {
  const user = await UserModel.findOneAndUpdate(
    { telegramId },
    updates,
    { new: true }
  ).lean();
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const getAllUsers = async () => {
  return await UserModel.find({}).lean();
};

export const deleteUser = async (userId: string) => {
  const result = await UserModel.deleteOne({ id: userId });
  if (result.deletedCount === 0) {
    throw new Error("User not found");
  }
  return { success: true };
};

export const authenticateTelegramUser = async (telegramId: number, telegramUsername?: string, fullName?: string) => {
  const isApprovedUserStatus = (status: unknown): boolean => {
    if (typeof status === "number") return status === 1;
    if (typeof status === "boolean") return status === true;
    if (typeof status === "string") {
      const normalized = status.trim().toLowerCase();
      return normalized === "1" || normalized === "allowed" || normalized === "active" || normalized === "approved" || normalized === "true";
    }
    return false;
  };

  // Check if user exists and is allowed (status = 1)
  const user = await UserModel.findOne({ telegramId });
  if (!user) {
    throw new Error("User not found. Please request access first.");
  }

  // Check if user is allowed (supports both numeric and string storage)
  if (!isApprovedUserStatus(user.status)) {
    throw new Error("Access denied. Your account is pending approval.");
  }

  // If user doesn't have an id field, generate one
  if (!user.id) {
    user.id = randomUUID();
    await user.save();
  }
  // Update user info if provided
  const updates: any = {};
  if (telegramUsername && user.telegramUsername !== telegramUsername) {
    updates.telegramUsername = telegramUsername;
  }
  if (fullName && user.fullName !== fullName) {
    updates.fullName = fullName;
  }

  if (Object.keys(updates).length > 0) {
    await UserModel.findOneAndUpdate(
      { id: user.id },
      updates
    );
  }

  return user.toObject();
};

export const authenticateCrowdworks = async (email: string, password: string): Promise<CwAuthResult> => {
  let browser: any = null;
  let page: any = null;
  let cwStatus: boolean = true;

  try {
    const currentTime = new Date().toISOString();
    let loginSuccess = false;
    let cookies = null;
    let authToken = null;

    const browserObj = await openBrowser();
    browser = browserObj.browser;
    page = browserObj.page;

    try {
      await page.goto("https://crowdworks.jp/login", { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      cwStatus = false;
    }

    if (!cwStatus) {
      return {
        success: false,
        message: "❌ Cannot authenticate because CrowdWorks is down or unreachable at the moment."
      };
    }

    await page.type('input[name="username"]', email, { delay: 120 });
    await page.type('input[name="password"]', password, { delay: 120 });
    await page.click('button[type="submit"]');

    try {
      const result = await Promise.race([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15 * 1000 }).then(() => 'navigated'),
        page.waitForSelector('div.r6DFO', { timeout: 15 * 1000 }).then(() => 'error')
      ]);
    } catch (err) {
      console.log('⏰ Timeout or unexpected issue during login wait:', err);
    }

    await delay(3000);
    // Check current URL to detect successful login
    let pageUrl = page.url();
    if (pageUrl.includes("dashboard")) {
      loginSuccess = true;
    } else {
      loginSuccess = false;
    }

    if (!loginSuccess) {
      return {
        success: false,
        message: "❌ Invalid Crowdworks credentials. Please check your email and password."
      };
    }

    // If login success, get cookies and csrf token from any page
    const cookiesArray = await page.cookies();

    // Only get the _cw_session_id cookie in proper format
    const cwSessionCookie = cookiesArray.find((c: any) => c.name === '_cw_session_id');
    cookies = cwSessionCookie ? `_cw_session_id=${cwSessionCookie.value};` : '';

    // Get auth_token from the meta tag
    authToken = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="csrf-token"]');
      return meta ? meta.getAttribute("content") : null;
    });

    if (browser) {
      await browser.close();
    }

    return {
      success: true,
      auth_token: authToken,
      cookie: cookies,
      message: "✅ Successfully authenticated with Crowdworks"
    };

  } catch (error: any) {
    console.error("Error during Crowdworks authentication:", error);

    if (browser) {
      await browser.close();
    }

    return {
      success: false,
      message: "❌ Authentication failed. Please try again later."
    };
  }
};

