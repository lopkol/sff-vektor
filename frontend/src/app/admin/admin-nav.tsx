"use client";

import { AppNavbar } from "@/components/app-navbar";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import type { MenuItem } from "@/lib/menu-item";

export function AdminNav() {
  const t = useTranslations("Admin.Nav");
  const pathname = usePathname();

  const pages: Pick<MenuItem, "title" | "url">[] = [
    {
      title: t("users"),
      url: "/admin/users",
    },
    {
      title: t("bookLists"),
      url: "/admin/book-lists",
    },
    {
      title: t("authors"),
      url: "/admin/authors",
    },
  ];

  const currentPage = pages.find((page) => pathname.startsWith(page.url));

  const rootPages: Pick<MenuItem, "title" | "url">[] = [
    {
      title: t("admin"),
      url: "/admin",
    },
    ...(currentPage ? [currentPage] : []),
  ];

  return <AppNavbar rootUrl="/admin" rootPages={rootPages} subPages={[]} />;
}
