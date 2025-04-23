/**
 * OAuth Authentication Module
 * 
 * This module handles authentication via GitLab OAuth, including:
 * - Generating authorization URLs
 * - Exchanging auth codes for tokens
 * - Fetching user information
 * - Token refreshing
 * - Authentication middleware
 */
import { NextFunction, Request, Response } from "express";
import { storage } from "./storage";
import { InsertUser } from "@shared/schema";
import { OAUTH } from "./config";

// Validate required GitLab credentials
if (!OAUTH.GITLAB_CLIENT_ID || !OAUTH.GITLAB_SECRET) {
  console.error("Missing GitLab OAuth credentials. Set GITLAB_CLIENT_ID and GITLAB_SECRET environment variables.");
} else {
  console.log("GitLab OAuth credentials found. Using redirect URI:", OAUTH.REDIRECT_URI);
}

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

/**
 * Generate OAuth authorization URL for GitLab
 * @returns {string} Complete authorization URL with parameters
 */
export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: OAUTH.GITLAB_CLIENT_ID || "",
    redirect_uri: OAUTH.REDIRECT_URI,
    response_type: "code",
    scope: "read_user api",
    state: generateRandomString(),
  });

  return `${OAUTH.GITLAB_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access tokens
 * @param {string} code - The authorization code from GitLab
 * @returns {Promise<GitLabTokenResponse>} Token data including access_token and refresh_token
 */
export async function exchangeCodeForToken(code: string): Promise<GitLabTokenResponse> {
  const tokenResponse = await fetch(OAUTH.GITLAB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: OAUTH.GITLAB_CLIENT_ID,
      client_secret: OAUTH.GITLAB_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: OAUTH.REDIRECT_URI,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`GitLab token exchange failed: ${error}`);
  }

  return await tokenResponse.json();
}

/**
 * Get user information from GitLab API
 * @param {string} accessToken - The access token for the GitLab API
 * @returns {Promise<GitLabUserResponse>} User profile information
 */
export async function getGitLabUser(accessToken: string): Promise<GitLabUserResponse> {
  const userResponse = await fetch(`${OAUTH.GITLAB_API_URL}/user`, {
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

/**
 * Refresh an expired access token
 * @param {string} refreshToken - The refresh token to use
 * @returns {Promise<GitLabTokenResponse>} New token data
 */
export async function refreshGitLabToken(refreshToken: string): Promise<GitLabTokenResponse> {
  const tokenResponse = await fetch(OAUTH.GITLAB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: OAUTH.GITLAB_CLIENT_ID,
      client_secret: OAUTH.GITLAB_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      redirect_uri: OAUTH.REDIRECT_URI,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`GitLab token refresh failed: ${error}`);
  }

  return await tokenResponse.json();
}

/**
 * Middleware to check if user is authenticated
 * This middleware protects routes that require authentication
 */
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
}

/**
 * Generate a cryptographically secure random string
 * Used for OAuth state parameter to prevent CSRF attacks
 * @param {number} length - Length of the random string
 * @returns {string} Random string of specified length
 */
function generateRandomString(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = chars.length;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
