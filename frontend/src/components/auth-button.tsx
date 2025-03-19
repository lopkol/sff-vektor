"use client";

import { Button } from "@/components/ui/button";
import { signIn, signOut, useSession } from "next-auth/react";
import { Loader2, LogIn, LogOut } from "lucide-react";
import { useUser } from "./user-provider";

export function AuthButton() {
  const { data: session, status } = useSession();
  const { user, isUserLoading } = useUser();
  const isLoading = status === "loading" || isUserLoading;

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (session) {
    return (
      <Button
        variant="ghost"
        onClick={() => signOut({ callbackUrl: "/" })}
        title="Sign out"
        className="w-full flex items-center align-start gap-2"
      >
        <LogOut className="h-4 w-4" />
        {user?.name}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => signIn("google", { callbackUrl: "/" })}
      title="Sign in with Google"
    >
      <LogIn className="h-4 w-4" />
    </Button>
  );
}
