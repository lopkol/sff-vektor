"use client";

import { UserRole } from "@/types/user";
import { useUser } from "./user-provider";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type RoleCheckProps = {
  children: React.ReactNode;
  role: UserRole;
  hide?: boolean;
  alertClassName?: string;
};

/**
 * Use this when you want to hide a specific part of a page based on the user's role
 * @param hide - If true, no alert will be shown in case of unauthorized access (default: false)
 */
export function RoleCheck(
  { children, role, hide = false, alertClassName }: RoleCheckProps,
) {
  const { user } = useUser();
  const t = useTranslations("RoleCheck");
  if (user?.role !== role) {
    if (hide) {
      return <></>;
    }
    return (
      <div className={alertClassName}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("unauthorizedTitle")}</AlertTitle>
          <AlertDescription>{t("unauthorizedDescription")}</AlertDescription>
        </Alert>
      </div>
    );
  }
  return children;
}

/**
 * Use this when you want to hide the full content of a page based on the user's role
 */
export function PageRoleCheck(
  { children, role, alertClassName }: RoleCheckProps,
) {
  return (
    <RoleCheck
      role={role}
      hide={false}
      alertClassName={cn("flex flex-1 flex-col gap-4 p-4", alertClassName)}
    >
      {children}
    </RoleCheck>
  );
}
