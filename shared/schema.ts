import { z } from "zod";
import { pgTable, serial, varchar, integer, timestamp, text, jsonb, boolean } from "drizzle-orm/pg-core";

export * from "./models/auth";

export const palaces = pgTable("palaces", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  locationName: varchar("location_name").notNull(),
  position: integer("position").notNull(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  currentDay: integer("current_day").notNull().default(1),
  currentLevel: integer("current_level").notNull().default(3),
  currentCategory: varchar("current_category", { length: 20 }).notNull().default("objects"),
  dayCount: integer("day_count").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastLogin: timestamp("last_login").defaultNow(),
  subscriptionStatus: text("subscription_status").notNull().default("inactive"),
  emailOptOut: boolean("email_opt_out").notNull().default(false),
});

export const sessionHistory = pgTable("session_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  level: integer("level").notNull(),
  category: varchar("category", { length: 20 }).notNull(),
  score: integer("score").notNull(),
  totalItems: integer("total_items").notNull(),
  assignmentsJson: text("assignments_json").notNull(),
  placeName: varchar("place_name", { length: 255 }).notNull(),
  stopsJson: text("stops_json").notNull(),
  userScenesJson: text("user_scenes_json").notNull().default("[]"),
});

export const assignmentSchema = z.object({
  stopName: z.string(),
  object: z.string(),
});

export type Assignment = z.infer<typeof assignmentSchema>;

export interface WalkthroughAnswer {
  stopName: string;
  userAnswer: string;
  correctObject: string;
  isCorrect: boolean;
}

export type Palace = typeof palaces.$inferSelect;
export type InsertPalace = typeof palaces.$inferInsert;
export type UserProgressRecord = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;
export type SessionHistoryRecord = typeof sessionHistory.$inferSelect;
export type InsertSessionHistory = typeof sessionHistory.$inferInsert;
