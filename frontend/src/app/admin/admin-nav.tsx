"use client";

import { AppNavbar } from "@/components/app-navbar";
import { Book, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export function AdminNav() {
  const t = useTranslations("Admin.Nav");

  return (
    <AppNavbar
      rootUrl="/admin"
      rootPages={[
        {
          title: t("admin"),
          url: "/admin",
        },
      ]}
      subPages={[
        {
          title: t("users"),
          url: "/users",
          icon: Users,
        },
        {
          title: t("bookLists"),
          url: "/book-lists",
          icon: Book,
        },
      ]}
    />
  );
}
