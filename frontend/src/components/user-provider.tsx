"use client";

import { createContext, ReactNode, useContext } from "react";
import { getAuthMe } from "@/services/auth";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { User } from "@/types/user";

// Create a context for user data
const UserContext = createContext<{
  user?: User;
  isUserLoading: boolean;
}>({
  isUserLoading: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const isEnabled = !!session?.accessToken;
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["auth", "me", isEnabled],
    queryFn: () => getAuthMe(),
    enabled: isEnabled,
    refetchOnWindowFocus: false,
  });

  return (
    <UserContext.Provider value={{ user, isUserLoading }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the UserContext
export function useUser() {
  return useContext(UserContext);
}
