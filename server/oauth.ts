import { NextFunction, Request, Response } from "express";
import { storage } from "./storage";
import { InsertUser } from "@shared/schema";

// Environment variable handling
const GITLAB_CLIENT_ID = process.env.GITLAB_CLIENT_ID;
const GITLAB_SECRET = process.env.GITLAB_SECRET;
const REDIRECT_URI = process.env.GITLAB_REDIRECT_URI || "https://workspace.bsegobiz.repl.co/api/auth/callback";

if (!GITLAB_CLIENT_ID || !GITLAB_SECRET) {
  console.error("Missing GitLab OAuth credentials. Set GITLAB_CLIENT_ID and GITLAB_SECRET environment variables.");
} else {
  console.log("GitLab OAuth credentials found. Using redirect URI:", REDIRECT_URI);
}

// GitLab API URLs
const GITLAB_AUTH_URL = "https://gitlab.com/oauth/authorize";
const GITLAB_TOKEN_URL = "https://gitlab.com/oauth/token";
const GITLAB_API_URL = "https://gitlab.com/api/v4";

// Types for GitLab responses
export interface GitLabTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
}

export interface GitLabUserResponse {
  id: number;
  username: string;
  email: string;
  name: string;
  avatar_url: string;
}

// Generate OAuth authorization URL
export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: GITLAB_CLIENT_ID || "",
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "read_user api",
    state: generateRandomString(),
  });

  return `${GITLAB_AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForToken(code: string): Promise<GitLabTokenResponse> {
  const tokenResponse = await fetch(GITLAB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITLAB_CLIENT_ID,
      client_secret: GITLAB_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`GitLab token exchange failed: ${error}`);
  }

  return await tokenResponse.json();
}

// Get user info from GitLab API
export async function getGitLabUser(accessToken: string): Promise<GitLabUserResponse> {
  const userResponse = await fetch(`${GITLAB_API_URL}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    const error = await userResponse.text();
    throw new Error(`GitLab API user request failed: ${error}`);
  }

  return await userResponse.json();
}

// Refresh access token
export async function refreshGitLabToken(refreshToken: string): Promise<GitLabTokenResponse> {
  const tokenResponse = await fetch(GITLAB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITLAB_CLIENT_ID,
      client_secret: GITLAB_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`GitLab token refresh failed: ${error}`);
  }

  return await tokenResponse.json();
}

// Middleware to check if user is authenticated
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
}

// Helper function to generate a random string for state param
function generateRandomString(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = chars.length;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
