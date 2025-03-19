import { getServerSession } from "next-auth/next";
import { getSession } from "next-auth/react";

/**
 * Gets the current session on the server side
 */
export async function getServerAuthSession() {
  return getServerSession();
}

/**
 * Gets the authentication header for API requests
 */
export async function getAuthHeader() {
  const session = await getSession();
  if (!session?.accessToken) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${session.accessToken}`,
  };
}

/**
 * Checks if a user is authenticated on the client side
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.accessToken;
}
