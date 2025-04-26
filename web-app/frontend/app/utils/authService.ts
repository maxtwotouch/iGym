
import { refreshToken } from "~/utils/api/token"; // your API calls

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
  accessTokenRefreshed: number;
  refreshTokenRefreshed: number;
}

const STORAGE_KEY = "authTokens";

export function readStoredTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

export function storeTokens(tokens: AuthTokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

/**
 * Core logic for obtaining a valid access token:
 *  A) If still valid, return it.
 *  B) If expired but refresh token valid, call refreshToken().
 *  C) Otherwise, return null.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = readStoredTokens();
  
  // Get time now
  const now = Date.now();

  if (now - tokens?.accessTokenRefreshed! < tokens?.accessTokenExpiry!) {
    return tokens!.accessToken;
  }

  if (now - tokens?.refreshTokenRefreshed! < tokens?.refreshTokenExpiry!) {
    // Attempt to refresh
    const refreshed = await refreshToken(tokens!.refreshToken); // returns new access token
    // If refreshToken() fails, return null
    if (!refreshed) {
      return null;
    }
    // Otherwise, update the stored tokens
    const newTokens: AuthTokens = {
      accessToken: refreshed,
      refreshToken: tokens!.refreshToken,
      accessTokenExpiry: tokens!.accessTokenExpiry,
      refreshTokenExpiry: tokens!.refreshTokenExpiry,
      accessTokenRefreshed: now,
      refreshTokenRefreshed: tokens!.refreshTokenRefreshed,
    };
    // Update the stored tokens
    storeTokens(newTokens);
    // Return the new access token
    //return newTokens.accessToken;

    setTimeout(() => {
      return newTokens.accessToken;
    }, 2000); // 2 seconds
  }

  // no valid tokens
  return null;
}