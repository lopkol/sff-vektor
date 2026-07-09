"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/components/user-provider";
import { UserRole } from "@/types/user";

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) {
      return;
    }
    // Admins land on the admin sub-page, everyone else on the reading list.
    const subPage = user?.role === UserRole.Admin ? "admin" : "list";
    router.replace(`${pathname}/${subPage}`);
  }, [isUserLoading, user, pathname, router]);

  return <></>;
}
