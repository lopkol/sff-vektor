"use client";

import { AppNavbar } from "@/components/app-navbar";
import { AppContent } from "@/components/app-content";
import { BookOpen, List, Settings, Table } from "lucide-react";
import { capitalize } from "@/lib/utils";
import { useBookList } from "./book-list-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname } from "next/navigation";
import { MenuItem } from "@/lib/menu-item";

const subPages: MenuItem[] = [
  {
    title: "List",
    url: "/list",
    icon: List,
  },
  {
    title: "Reading",
    url: "/reading",
    icon: BookOpen,
  },
  {
    title: "Table",
    url: "/table",
    icon: Table,
  },
  {
    title: "Admin",
    url: "/admin",
    icon: Settings,
  },
];

export function BookListLayout({ children }: { children: React.ReactNode }) {
  const { year, genre } = useBookList();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const rootUrl = `/book-lists/${year}/${genre}`;
  const currentPage = pathname.split("/").pop();

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
