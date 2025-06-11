import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect } from "react";

export function useAuth() {
  const { data: session, status } = useSession();

  // Automatically sign out if there's a refresh error
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      console.warn("Token refresh failed, signing out...");
      signOut({ callbackUrl: "/" });
    }
  }, [session?.error]);

  const isAuthenticated = useCallback(() => {
    return status === "authenticated" && !!session?.accessToken;
  }, [status, session?.accessToken]);

  const getAuthHeader = useCallback(() => {
    if (!session?.accessToken) {
      return undefined;
    }

    return {
      Authorization: `Bearer ${session.accessToken}`,
    };
  }, [session?.accessToken]);

  return {
    session,
    status,
    isAuthenticated: isAuthenticated(),
    getAuthHeader,
    signOut: () => signOut({ callbackUrl: "/" }),
  };
}
