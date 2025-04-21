import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  gitlabId: integer("gitlab_id").notNull().unique(),
  gitlabAccessToken: text("gitlab_access_token"),
  gitlabRefreshToken: text("gitlab_refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  scenarioRuns: many(scenarioRuns),
}));

// Scenario model
export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  targetApps: text("target_apps").array(),
  execCommand: text("exec_command").notNull(),
  filePath: text("file_path").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scenariosRelations = relations(scenarios, ({ many }) => ({
  runs: many(scenarioRuns),
}));

// Scenario Run model
export const scenarioRuns = pgTable("scenario_runs", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").notNull().references(() => scenarios.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  output: text("output"),
});

export const scenarioRunsRelations = relations(scenarioRuns, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [scenarioRuns.scenarioId],
    references: [scenarios.id],
  }),
  user: one(users, {
    fields: [scenarioRuns.userId],
    references: [users.id],
  }),
}));

// Stats model (for dashboard)
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  totalScenarios: integer("total_scenarios").default(0),
  successfulRuns: integer("successful_runs").default(0),
  failedRuns: integer("failed_runs").default(0),
  lastRunTime: timestamp("last_run_time"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScenarioRunSchema = createInsertSchema(scenarioRuns).omit({
  id: true,
  startTime: true,
});

export const updateScenarioRunSchema = z.object({
  status: z.enum(["pending", "running", "success", "failed"]),
  endTime: z.date().optional(),
  duration: z.number().optional(),
  output: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;

export type ScenarioRun = typeof scenarioRuns.$inferSelect;
export type InsertScenarioRun = z.infer<typeof insertScenarioRunSchema>;
export type UpdateScenarioRun = z.infer<typeof updateScenarioRunSchema>;

export type Stats = typeof stats.$inferSelect;
