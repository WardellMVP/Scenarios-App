import { 
  users, scenarios, scenarioRuns, stats,
  type User, type InsertUser, 
  type Scenario, type InsertScenario,
  type ScenarioRun, type InsertScenarioRun, type UpdateScenarioRun,
  type Stats
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByGitlabId(gitlabId: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(id: number, accessToken: string, refreshToken: string): Promise<User | undefined>;
  
  // Scenario operations
  getScenarios(): Promise<Scenario[]>;
  getScenario(id: number): Promise<Scenario | undefined>;
  createScenario(scenario: InsertScenario): Promise<Scenario>;
  updateScenario(id: number, scenario: Partial<InsertScenario>): Promise<Scenario | undefined>;
  deleteScenario(id: number): Promise<boolean>;
  
  // Scenario runs
  createScenarioRun(run: InsertScenarioRun): Promise<ScenarioRun>;
  getScenarioRun(id: number): Promise<ScenarioRun | undefined>;
  updateScenarioRun(id: number, update: UpdateScenarioRun): Promise<ScenarioRun | undefined>;
  getScenarioRuns(scenarioId: number, limit?: number): Promise<ScenarioRun[]>;
  getScenarioRunsWithUserAndScenario(limit?: number): Promise<any[]>;
  
  // Stats operations
  getStats(): Promise<Stats | undefined>;
  updateStats(): Promise<Stats | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByGitlabId(gitlabId: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.gitlabId, gitlabId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserTokens(id: number, accessToken: string, refreshToken: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        gitlabAccessToken: accessToken,
        gitlabRefreshToken: refreshToken,
      })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Scenario operations
  async getScenarios(): Promise<Scenario[]> {
    return await db.select().from(scenarios);
  }

  async getScenario(id: number): Promise<Scenario | undefined> {
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
    return scenario;
  }

  async createScenario(scenario: InsertScenario): Promise<Scenario> {
    const [newScenario] = await db.insert(scenarios).values(scenario).returning();
    await this.updateStats();
    return newScenario;
  }

  async updateScenario(id: number, scenario: Partial<InsertScenario>): Promise<Scenario | undefined> {
    const [updatedScenario] = await db
      .update(scenarios)
      .set({
        ...scenario,
        updatedAt: new Date(),
      })
      .where(eq(scenarios.id, id))
      .returning();
    
    return updatedScenario;
  }

  async deleteScenario(id: number): Promise<boolean> {
    const result = await db.delete(scenarios).where(eq(scenarios.id, id));
    await this.updateStats();
    return true;
  }

  // Scenario run operations
  async createScenarioRun(run: InsertScenarioRun): Promise<ScenarioRun> {
    const [newRun] = await db.insert(scenarioRuns).values(run).returning();
    await this.updateStats();
    return newRun;
  }

  async getScenarioRun(id: number): Promise<ScenarioRun | undefined> {
    const [run] = await db.select().from(scenarioRuns).where(eq(scenarioRuns.id, id));
    return run;
  }

  async updateScenarioRun(id: number, update: UpdateScenarioRun): Promise<ScenarioRun | undefined> {
    const [updatedRun] = await db
      .update(scenarioRuns)
      .set(update)
      .where(eq(scenarioRuns.id, id))
      .returning();
    
    await this.updateStats();
    return updatedRun;
  }

  async getScenarioRuns(scenarioId: number, limit = 10): Promise<ScenarioRun[]> {
    return await db
      .select()
      .from(scenarioRuns)
      .where(eq(scenarioRuns.scenarioId, scenarioId))
      .orderBy(desc(scenarioRuns.startTime))
      .limit(limit);
  }

  async getScenarioRunsWithUserAndScenario(limit = 10): Promise<any[]> {
    return await db.query.scenarioRuns.findMany({
      limit,
      orderBy: desc(scenarioRuns.startTime),
      with: {
        scenario: true,
        user: true
      },
    });
  }

  // Stats operations
  async getStats(): Promise<Stats | undefined> {
    const [currentStats] = await db.select().from(stats).limit(1);
    if (!currentStats) {
      return this.updateStats();
    }
    return currentStats;
  }

  async updateStats(): Promise<Stats | undefined> {
    // Get counts
    const [{ count: totalScenarios }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(scenarios);
    
    const [{ count: successfulRuns }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(scenarioRuns)
      .where(eq(scenarioRuns.status, "success"));
    
    const [{ count: failedRuns }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(scenarioRuns)
      .where(eq(scenarioRuns.status, "failed"));
    
    // Get last run time
    const [lastRun] = await db
      .select({ startTime: scenarioRuns.startTime })
      .from(scenarioRuns)
      .orderBy(desc(scenarioRuns.startTime))
      .limit(1);
    
    const lastRunTime = lastRun?.startTime;
    
    // Check if stats exists
    const [currentStats] = await db.select().from(stats).limit(1);
    
    if (currentStats) {
      // Update existing stats
      const [updatedStats] = await db
        .update(stats)
        .set({
          totalScenarios,
          successfulRuns,
          failedRuns,
          lastRunTime,
          updatedAt: new Date(),
        })
        .where(eq(stats.id, currentStats.id))
        .returning();
      
      return updatedStats;
    } else {
      // Create new stats
      const [newStats] = await db
        .insert(stats)
        .values({
          totalScenarios,
          successfulRuns,
          failedRuns,
          lastRunTime,
          updatedAt: new Date(),
        })
        .returning();
      
      return newStats;
    }
  }
}

export const storage = new DatabaseStorage();
