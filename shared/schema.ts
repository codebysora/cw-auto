import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: text("telegram_id").notNull().unique(),
  telegramUsername: text("telegram_username"),
  email: text("email").notNull(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  age: integer("age"),
  birthday: text("birthday"),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("user"), // user, admin, superadmin
  status: text("status").notNull().default("pending"), // pending, allowed, blocked
  createdAt: timestamp("created_at").defaultNow(),
});

// Crowdworks Profile Schema
export const cwProfiles = pgTable("cw_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cwEmail: text("cw_email").notNull(),
  cwPassword: text("cw_password").notNull(),
  accountId: text("account_id"),
  accountLink: text("account_link"),
  profileDescription: text("profile_description"), // User's own profile description
  isPrimary: boolean("is_primary").default(true), // Always true since only one profile per user
  auth_token: text("auth_token"),
  cookie: text("cookie"),
  lastAuthAt: timestamp("last_auth_at"),
  authStatus: boolean("auth_status").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bid Template Schema
export const bidTemplates = pgTable("bid_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(), // web development, app development, etc.
  prompt: text("prompt").notNull(),
  template: text("template").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Auto Bid Schedule Schema
export const autoBidSchedules = pgTable("auto_bid_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isActive: boolean("is_active").default(false),
  daysOfWeek: text("days_of_week").array(), // ["Monday", "Tuesday", "Wednesday"]
  timeRangeStart: text("time_range_start"), // "09:00"
  timeRangeEnd: text("time_range_end"), // "18:00"
  startDate: text("start_date"), // "2024-01-01"
  endDate: text("end_date"), // "2024-12-31"
  // Fixed budget settings
  fixedBudgetLevel: text("fixed_budget_level").notNull(), // low, medium, high, custom
  fixedBudgetMin: integer("fixed_budget_min"),
  fixedBudgetMax: integer("fixed_budget_max"),
  hourlyBudgetLevel: text("hourly_budget_level").notNull(), // low, medium, high, custom
  hourlyBudgetMin: integer("hourly_budget_min"),
  hourlyBudgetMax: integer("hourly_budget_max"),
  clientBudgetPreference: text("client_budget_preference").notNull(), // low, high
  preferredHourlyBudget: integer("preferred_hourly_budget").notNull(),
  hoursLimit: integer("hours_limit"),
  preferredRoles: text("preferred_roles").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bid History Schema
export const bidHistory = pgTable("bid_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  jobTitle: text("job_title").notNull(),
  budget: integer("budget"),
  message: text("message"),
  status: text("status").notNull(), // sent, replied, contacted
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics Schema
export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  bidCount: integer("bid_count").default(0),
  messageCount: integer("message_count").default(0),
  contactCount: integer("contact_count").default(0),
  jobsPosted: integer("jobs_posted").default(0),
});

// Past Work Schema
export const pastWork = pgTable("past_work", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: text("telegram_id").notNull(),
  category: text("category").notNull(),
  role: text("role").notNull(),
  projectUrl: text("project_url").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCwProfileSchema = createInsertSchema(cwProfiles).omit({
  id: true,
  createdAt: true,
});

export const insertBidTemplateSchema = createInsertSchema(bidTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertAutoBidScheduleSchema = createInsertSchema(autoBidSchedules).omit({
  id: true,
  createdAt: true,
});

export const insertBidHistorySchema = createInsertSchema(bidHistory).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
});

export const insertPastWorkSchema = createInsertSchema(pastWork).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCwProfile = z.infer<typeof insertCwProfileSchema>;
export type CwProfile = typeof cwProfiles.$inferSelect;

export type InsertBidTemplate = z.infer<typeof insertBidTemplateSchema>;
export type BidTemplate = typeof bidTemplates.$inferSelect;

export type InsertAutoBidSchedule = z.infer<typeof insertAutoBidScheduleSchema>;
export type AutoBidSchedule = typeof autoBidSchedules.$inferSelect;

export type InsertBidHistory = z.infer<typeof insertBidHistorySchema>;
export type BidHistory = typeof bidHistory.$inferSelect;

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

export type InsertPastWork = z.infer<typeof insertPastWorkSchema>;
export type PastWork = typeof pastWork.$inferSelect;
