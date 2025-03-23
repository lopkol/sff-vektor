"use client";

import { AppNavbar } from "@/components/app-navbar";
import { AppContent } from "@/components/app-content";
import { BookOpen, List, Settings, Table } from "lucide-react";
import { capitalize } from "@/lib/utils";
import { useBookListGenre } from "./book-list-genre-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname } from "next/navigation";
import type { MenuItem } from "@/lib/menu-item";
import { useTranslations } from "next-intl";
import { useBookListYear } from "../book-list-year-provider";

export function BookListLayout({ children }: { children: React.ReactNode }) {
  const { year } = useBookListYear();
  const { genre } = useBookListGenre();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const t = useTranslations("BookList.Nav");

  const rootUrl = `/book-lists/${year}/${genre}`;
  const currentPage = pathname.split("/").pop();

  const subPages: MenuItem[] = [
    {
      title: t("list"),
      url: "/list",
      icon: List,
    },
    {
      title: t("reading"),
      url: "/reading",
      icon: BookOpen,
    },
    {
      title: t("table"),
      url: "/table",
      icon: Table,
    },
    {
      title: t("admin"),
      url: "/admin",
      icon: Settings,
    },
  ];

  const rootPages: MenuItem[] = [
    {
      title: year,
      url: "#",
    },
    {
      title: capitalize(genre.replace(/-/g, " ")),
      url: rootUrl,
    },
    ...(isMobile
      ? [
          {
            title:
              subPages.find((page) => page.url === `/${currentPage}`)?.title ??
              "...",
            url: `/book-lists/${year}/${genre}/${currentPage}`,
          },
        ]
      : []),
  ];

  return (
    <>
      <AppNavbar rootUrl={rootUrl} rootPages={rootPages} subPages={subPages} />
      <AppContent>{children}</AppContent>
    </>
  );
}
