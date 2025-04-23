import express, { type Express, Request, Response } from "express";
import session from "express-session";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { z } from "zod";
import WebSocket from "ws";

// Extend Express session types
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

import { storage } from "./storage";
import { 
  getAuthUrl, exchangeCodeForToken, 
  getGitLabUser, ensureAuthenticated
} from "./oauth";
import { syncScenariosFromGitLab, loadScenarios } from "./scenarios";
import { executeScenario, handleWebSocketConnection } from "./execution";
import { pool } from "./db";
import ConnectPgSimple from "connect-pg-simple";

// Initialize sessions with PostgreSQL store
const PgSession = ConnectPgSimple(session);

const SESSION_SECRET = process.env.SESSION_SECRET || 'cybersim_session_secret';

// Session handling
const sessionParser = session({
  store: new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
});

// Initialize scenarios on startup
(async () => {
  await loadScenarios();
})();

export async function registerRoutes(app: Express): Promise<Server> {
  // Use session middleware
  app.use(sessionParser);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: "/ws"
  });
  
  // Handle WebSocket connections
  wss.on("connection", (ws: WebSocket) => {
    handleWebSocketConnection(ws);
  });
  
  // Auth routes
  app.get("/api/auth/login", (req: Request, res: Response) => {
    const authUrl = getAuthUrl();
    res.json({ url: authUrl });
  });
  
  // Keep the original callback for backward compatibility
  app.get("/api/auth/callback", handleAuthCallback);
  
  // Add the new callback route to match GitLab settings
  app.get("/auth/gitlab/callback", handleAuthCallback);
  
  // Extract the callback handler to a separate function
  async function handleAuthCallback(req: Request, res: Response) {
    try {
      const { code } = req.query;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "Missing authorization code" });
      }
      
      // Exchange code for token
      const tokenData = await exchangeCodeForToken(code);
      
      // Get user information
      const gitlabUser = await getGitLabUser(tokenData.access_token);
      
      // Find or create user
      let user = await storage.getUserByGitlabId(gitlabUser.id);
      
      if (user) {
        // Update tokens
        user = await storage.updateUserTokens(
          user.id,
          tokenData.access_token,
          tokenData.refresh_token
        );
      } else {
        // Create new user
        user = await storage.createUser({
          username: gitlabUser.username,
          email: gitlabUser.email,
          displayName: gitlabUser.name,
          avatarUrl: gitlabUser.avatar_url,
          gitlabId: gitlabUser.id,
          gitlabAccessToken: tokenData.access_token,
          gitlabRefreshToken: tokenData.refresh_token,
        });
        
        // Initial sync of scenarios
        try {
          await syncScenariosFromGitLab(tokenData.access_token);
        } catch (error) {
          console.error("Error during initial scenario sync:", error);
        }
      }
      
      // Save user to session
      req.session.userId = user.id;
      
      // Redirect to frontend
      res.redirect("/");
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  }
  
  app.get("/api/auth/user", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't expose tokens
      const { gitlabAccessToken, gitlabRefreshToken, ...safeUser } = user;
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // Scenarios routes
  app.get("/api/scenarios", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const scenarios = await storage.getScenarios();
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      res.status(500).json({ message: "Failed to fetch scenarios" });
    }
  });
  
  app.get("/api/scenarios/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid scenario ID" });
      }
      
      const scenario = await storage.getScenario(id);
      
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      res.json(scenario);
    } catch (error) {
      console.error("Error fetching scenario:", error);
      res.status(500).json({ message: "Failed to fetch scenario" });
    }
  });
  
  // Scenario runs
  app.post("/api/scenarios/:id/run", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid scenario ID" });
      }
      
      const scenario = await storage.getScenario(id);
      
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      // Execute the scenario
      const runId = await executeScenario(id, userId, scenario.execCommand);
      
      res.json({ runId });
    } catch (error) {
      console.error("Error executing scenario:", error);
      res.status(500).json({ message: "Failed to execute scenario" });
    }
  });
  
  app.get("/api/runs/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid run ID" });
      }
      
      const run = await storage.getScenarioRun(id);
      
      if (!run) {
        return res.status(404).json({ message: "Run not found" });
      }
      
      res.json(run);
    } catch (error) {
      console.error("Error fetching run:", error);
      res.status(500).json({ message: "Failed to fetch run" });
    }
  });
  
  app.get("/api/scenarios/:id/runs", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid scenario ID" });
      }
      
      const runs = await storage.getScenarioRuns(id);
      res.json(runs);
    } catch (error) {
      console.error("Error fetching scenario runs:", error);
      res.status(500).json({ message: "Failed to fetch scenario runs" });
    }
  });
  
  // Stats route
  app.get("/api/stats", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  // Sync scenarios from GitLab
  app.post("/api/sync", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.gitlabAccessToken) {
        return res.status(401).json({ message: "No valid GitLab token found" });
      }
      
      await syncScenariosFromGitLab(user.gitlabAccessToken);
      
      res.json({ message: "Scenarios synced successfully" });
    } catch (error) {
      console.error("Error syncing scenarios:", error);
      res.status(500).json({ message: "Failed to sync scenarios" });
    }
  });
  
  return httpServer;
}
