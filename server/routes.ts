import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import {
  insertUserSchema,
  insertCwProfileSchema,
  insertBidTemplateSchema,
  insertAutoBidScheduleSchema,
  insertBidHistorySchema,
  insertAnalyticsSchema,
} from "@shared/schema";
import { z } from "zod";
import * as authController from "./controller/authController";
import * as cwProfileController from "./controller/cwProfileController";
import * as bidTemplateController from "./controller/bidTemplateController";
import * as autoBidScheduleController from "./controller/autoBidScheduleController";
import * as bidHistoryController from "./controller/bidHistoryController";
import * as analyticsController from "./controller/analyticsController";
import * as promptController from "./controller/promptController";
import * as pastWorkController from "./controller/pastWorkController";
import * as jobController from "./controller/jobController";
import * as blockedClientController from "./controller/blockedClientController";

export async function registerRoutes(app: Express): Promise<Server> {
  const requireAuth = (req: any, res: any, next: any) => {

    if (req.body && Object.keys(req.body).length !== 0) req.telegramId = req.body.telegramId;
    else if (req.query && Object.keys(req.query).length !== 0) req.telegramId = req.query.telegramId;

    if (!req.telegramId) {
      return res.status(401).json({ error: "Unauthorized. Telegram ID is required." });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    next();
  };

  // ==================== User Routes ====================

  // Telegram Mini App Authentication
  app.post("/api/auth/telegram", async (req: Request, res: Response) => {
    try {
      const { telegramId, telegramUsername, fullName } = req.body;
      const user = await authController.authenticateTelegramUser(telegramId, telegramUsername, fullName);
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(401).json({ error: error.message || "Authentication failed" });
    }
  });

  // Get current user
  app.get("/api/user", requireAuth, async (req: any, res: Response) => {
    try {
      const user = await authController.getUserByTelegramId(req.telegramId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ data: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(404).json({ error: error.message || "User not found" });
    }
  });

  // Update user profile
  app.patch("/api/user", requireAuth, async (req: any, res: Response) => {
    try {
      const user = await authController.updateUser(req.telegramId, req.body);
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(404).json({ error: error.message || "User not found" });
    }
  });

  // ==================== CW Profile Routes ====================

  // Get all CW profiles for user
  app.get("/api/cw-profiles", requireAuth, async (req: any, res: Response) => {
    try {
      const profiles = await cwProfileController.getCwProfiles(req.telegramId);
      if (!profiles) {
        return res.status(404).json({ error: "Profiles not found" });
      }
      res.json({ data: profiles });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get profiles" });
    }
  });

  // Create CW profile
  app.post("/api/cw-profiles", requireAuth, async (req: any, res: Response) => {
    try {
      const data = insertCwProfileSchema.parse(req.body);
      const profile = await cwProfileController.createCwProfile(req.telegramId, data);
      res.json({ data: profile });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error });
      }
      res.status(500).json({ error: error.message || "Failed to create profile" });
    }
  });

  // Update CW profile
  app.patch("/api/cw-profiles", requireAuth, async (req: any, res: Response) => {
    try {
      const profile = await cwProfileController.updateCwProfile(req.telegramId, req.body);
      res.json(profile);
    } catch (error: any) {
      res.status(404).json({ error: error.message || "Profile not found" });
    }
  });

  // Delete CW profile
  app.delete("/api/cw-profiles/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await cwProfileController.deleteCwProfile(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(404).json({ error: error.message || "Profile not found" });
    }
  });

  // ==================== Bid Template Routes ====================

  // Get all bid templates for user
  app.get("/api/bid-templates", requireAuth, async (req: any, res: Response) => {
    try {
      const templates = await bidTemplateController.getBidTemplates(req.telegramId);
      if (!templates) {
        return res.status(404).json({ error: "Templates not found" });
      }
      res.json({ data: templates });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get templates" });
    }
  });

  // Create bid template
  app.post("/api/bid-templates", requireAuth, async (req: any, res: Response) => {
    try {
      const data = insertBidTemplateSchema.parse({ ...req.body });
      const template = await bidTemplateController.createBidTemplate(req.telegramId, data);
      res.json({ data: { template, success: true, message: "Template created successfully" } });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create template" });
    }
  });

  // Update bid template
  app.patch("/api/bid-templates/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const template = await bidTemplateController.updateBidTemplate(id, req.body);
      res.json({ data: template });
    } catch (error: any) {
      res.status(404).json({ error: error.message || "Template not found" });
    }
  });

  // Delete bid template
  app.delete("/api/bid-templates/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await bidTemplateController.deleteBidTemplate(id);
      res.json({
        data:
          { success: true, message: "Template deleted successfully" }
      });
    } catch (error: any) {
      res.status(404).json({
        data:
          { success: false, error: error.message || "Template not found" }
      });
    }
  });

  // ==================== Auto Bid Schedule Routes ====================

  // Get auto bid schedule for user
  app.get("/api/auto-bid-schedule", requireAuth, async (req: any, res: Response) => {
    try {
      const schedule = await autoBidScheduleController.getAutoBidSchedule(req.telegramId);
      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }
      res.json({ data: schedule });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get schedule" });
    }
  });

  // Create or update auto bid schedule
  app.post("/api/auto-bid-schedule", requireAuth, async (req: any, res: Response) => {
    try {
      const data = insertAutoBidScheduleSchema.parse({ ...req.body });
      const schedule = await autoBidScheduleController.createOrUpdateAutoBidSchedule(req.telegramId, data);
      res.json({ data: schedule });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to save schedule" });
    }
  });

  // Get all auto bid schedules (admin only)
  app.get("/api/auto-bid-schedules", requireAdmin, async (req: any, res: Response) => {
    try {
      const schedules = await autoBidScheduleController.getAllAutoBidSchedules();
      if (!schedules) {
        return res.status(404).json({ error: "Schedules not found" });
      }
      res.json({ data: schedules });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get schedules" });
    }
  });

  // ==================== Bid History Routes ====================

  // Get bid history for user
  app.get("/api/bid-history", requireAuth, async (req: any, res: Response) => {
    try {
      const histories = await bidHistoryController.getBidHistories(req.userId);
      if (!histories) {
        return res.status(404).json({ error: "Bid history not found" });
      }
      res.json(histories);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get bid history" });
    }
  });

  // Create or add bid to a day
  app.post("/api/bid-history", requireAuth, async (req: any, res: Response) => {
    try {
      const { date, bid } = req.body;
      const history = await bidHistoryController.addBidToDay(req.userId, new Date(date), bid);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to add bid" });
    }
  });

  // Get bid history for a specific date
  app.get("/api/bid-history/:date", requireAuth, async (req: any, res: Response) => {
    try {
      const { date } = req.params;
      const history = await bidHistoryController.getBidHistoryByDate(req.userId, new Date(date));
      if (!history) {
        return res.status(404).json({ error: "Bid history not found" });
      }
      res.json(history || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get bid history" });
    }
  });

  // ==================== Analytics Routes ====================

  // Get analytics for user
  app.get("/api/analytics", requireAuth, async (req: any, res: Response) => {
    try {
      const analytics = await analyticsController.getAnalytics(req.userId);
      if (!analytics) {
        return res.status(404).json({ error: "Analytics not found" });
      }
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get analytics" });
    }
  });

  // Create or update analytics entry
  app.post("/api/analytics", requireAuth, async (req: any, res: Response) => {
    try {
      const data = insertAnalyticsSchema.parse({ ...req.body, userId: req.userId });
      const analytics = await analyticsController.createOrUpdateAnalytics(req.userId, data.date, data);
      if (!analytics) {
        return res.status(404).json({ error: "Analytics not found" });
      }
      res.json(analytics);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to save analytics" });
    }
  });

  // ==================== Admin Routes ====================

  // Blocked clients (admin only) - block client IDs so their jobs are not scraped/saved
  app.get("/api/admin/blocked-clients", requireAuth, requireAdmin, async (_req: any, res: Response) => {
    try {
      const list = await blockedClientController.getAllBlockedClients();
      res.json({ data: list });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to list blocked clients" });
    }
  });
  app.post("/api/admin/blocked-clients", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const { clientId, url } = req.body || {};
      const id = url != null ? blockedClientController.parseClientIdFromUrl(url) : (clientId != null ? Number(clientId) : null);
      if (id == null || isNaN(id)) {
        return res.status(400).json({ error: "Provide clientId (number) or url (e.g. https://crowdworks.jp/public/employers/6798718)" });
      }
      const result = await blockedClientController.addBlockedClient(id);
      if (!result.success) return res.status(400).json({ error: result.message });
      res.json({ data: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to add blocked client" });
    }
  });
  app.delete("/api/admin/blocked-clients/:clientId", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId, 10);
      if (isNaN(clientId)) return res.status(400).json({ error: "Invalid client ID" });
      const result = await blockedClientController.removeBlockedClient(clientId);
      if (!result.success) return res.status(404).json({ error: result.message });
      res.json({ data: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to remove blocked client" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const users = await authController.getAllUsers();
      const sanitized = users.map((u: any) => ({ ...u, password: undefined }));
      if (!sanitized) {
        return res.status(404).json({ error: "Users not found" });
      }
      res.json(sanitized);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get users" });
    }
  });

  // Update user status/role (admin only)
  app.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const user = await authController.updateUser(id, req.body);
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(404).json({ error: error.message || "User not found" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await authController.deleteUser(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(404).json({ error: error.message || "User not found" });
    }
  });

  // Get all analytics (admin only)
  app.get("/api/admin/analytics", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const analytics = await analyticsController.getAllAnalytics();
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get analytics" });
    }
  });

  // Prompt Management Routes


  // Get all prompts for user
  app.get("/api/prompts", requireAuth, async (req: any, res: Response) => {
    try {
      const prompts = await promptController.getPromptsByTelegramId(req.telegramId);
      res.json({ data: prompts });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get prompts" });
    }
  });

  // Get specific prompt
  app.get("/api/prompts/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const prompt = await promptController.getPromptById(req.userId, id);
      if (!prompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }
      res.json(prompt);
    } catch (error: any) {
      res.status(404).json({ error: error.message || "Prompt not found" });
    }
  });

  // Create new prompt
  app.post("/api/prompts", requireAuth, async (req: any, res: Response) => {
    try {
      const { name, description, prompt, category, isActive } = req.body;

      if (!name || !prompt || !category) {
        return res.status(400).json({ error: "Name, prompt, and category are required" });
      }
      const newPrompt = await promptController.createPrompt(req.telegramId, {
        name,
        description,
        prompt,
        category,
        isActive,
      });

      res.json(newPrompt);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create prompt" });
    }
  });

  // Update prompt
  app.patch("/api/prompts/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedPrompt = await promptController.updatePrompt(req.telegramId, id, updateData);
      res.json(updatedPrompt);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update prompt" });
    }
  });

  // Delete prompt
  app.delete("/api/prompts/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await promptController.deletePrompt(req.telegramId, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete prompt" });
    }
  });

  // ==================== Past Work Routes ====================

  // Get all past work for user
  app.get("/api/past-work", requireAuth, async (req: any, res: Response) => {
    try {
      const pastWork = await pastWorkController.getPastWorkByTelegramId(Number(req.telegramId));
      if (!pastWork) {
        return res.status(404).json({ message: "Past work not found" });
      }
      res.json({ data: pastWork });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get past work" });
    }
  });

  // Get specific past work
  app.get("/api/past-work/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const work = await pastWorkController.getPastWorkById(Number(req.telegramId), id);
      if (!work) {
        return res.status(404).json({ error: "Past work not found" });
      }
      res.json(work);
    } catch (error: any) {
      res.status(404).json({ error: error.message || "Past work not found" });
    }
  });

  // Create new past work
  app.post("/api/past-work", requireAuth, async (req: any, res: Response) => {
    try {
      const { category, role, projectUrl, description, isActive } = req.body;

      if (!category || !role || !projectUrl || !description) {
        return res.status(400).json({ error: "Category, role, project URL, and description are required" });
      }

      if (!projectUrl.trim()) {
        return res.status(400).json({ error: "Project URL cannot be empty" });
      }

      const pastWork = await pastWorkController.createPastWork(Number(req.telegramId), {
        category,
        role,
        projectUrl: projectUrl.trim(),
        description,
        isActive: isActive ?? true,
      });
      res.json({ data: pastWork });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create past work" });
    }
  });

  // Update past work
  app.patch("/api/past-work/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const pastWork = await pastWorkController.updatePastWork(Number(req.telegramId), id, updateData);
      res.json({ data: pastWork });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update past work" });
    }
  });

  // Delete past work
  app.delete("/api/past-work/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await pastWorkController.deletePastWork(Number(req.telegramId), id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete past work" });
    }
  });

  // ==================== Job Routes ====================

  // Get jobs for a specific date in CSV-like structure (source: db = from DB and save CSV, file = from saved CSV only)
  app.get("/api/jobs/by-date-csv", async (req: any, res: Response) => {
    try {
      const { date, source } = req.query;
      if (!date) {
        return res.status(400).json({ error: "Date parameter is required (YYYY-MM-DD format)" });
      }
      const useFile = source === "file";
      const result = useFile
        ? jobController.getJobsByDateFromCSVFile(date as string)
        : await jobController.getJobsByDateCSV(date as string);
      if (!result) {
        return res.status(404).json({ error: useFile ? "No saved file for this date" : "Failed to load data" });
      }
      res.json({ data: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get jobs by date CSV" });
    }
  });

  // Get jobs aggregated by period (today, this_week, this_month, custom) for graph view
  app.get("/api/jobs/by-period-csv", async (req: any, res: Response) => {
    try {
      const { period = "today", startDate, endDate } = req.query;
      const result = await jobController.getJobsByPeriodCSV(
        period as string,
        startDate as string | undefined,
        endDate as string | undefined
      );
      res.json({ data: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get jobs by period CSV" });
    }
  });

  // Get clients for a specific graph segment (time/budget) for day or period
  app.get("/api/jobs/clients-by-graph", async (req: any, res: Response) => {
    try {
      const {
        scope = "single_day",
        date,
        period = "today",
        startDate,
        endDate,
        timeRange,
        budgetRange,
      } = req.query;

      const result = await jobController.getClientsByGraphFilter({
        scope: scope === "period" ? "period" : "single_day",
        date: date as string | undefined,
        period: period as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        timeRange: timeRange as string | undefined,
        budgetRange: budgetRange as string | undefined,
      });

      res.json({ data: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get clients for graph segment" });
    }
  });

  // List dates that have a saved CSV file in data/csv
  app.get("/api/jobs/csv-dates", async (_req: any, res: Response) => {
    try {
      const dates = await jobController.listAvailableCSVDates();
      res.json({ data: dates });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to list CSV dates" });
    }
  });

  // Download CSV file for a date (saved in server/data/csv; opens in Excel)
  app.get("/api/jobs/csv-file", async (req: any, res: Response) => {
    try {
      const { date } = req.query;
      if (!date || typeof date !== "string") {
        return res.status(400).json({ error: "Date parameter is required (YYYY-MM-DD format)" });
      }
      const filePath = jobController.getCSVFilePathForDate(date);
      if (!filePath) {
        return res.status(404).json({ error: "No CSV file found for this date" });
      }
      const filename = `jobs_${date}.csv`;
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.sendFile(filePath);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to download CSV" });
    }
  });

  // Get jobs by time period (without interval grouping)
  app.get("/api/jobs/by-period", requireAuth, async (req: any, res: Response) => {
    try {
      const { period = 'today', startDate, endDate } = req.query;

      const jobs = await jobController.getJobsByPeriod(
        period as string,
        startDate as string | undefined,
        endDate as string | undefined
      );

      res.json({ data: jobs });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get jobs by period" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
