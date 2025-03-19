"use client";

import Image from "next/image";
import { Wand, Orbit, BookCopy, ShieldUser, ChevronRight } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { usePathname } from "next/navigation";
import { MenuItem } from "@/lib/menu-item";
import Link from "next/link";
import { getBookLists } from "@/services/book-lists";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { capitalize } from "@/lib/utils";
import { Skeleton } from "@radix-ui/themes";
import { AuthButton } from "./auth-button";

const staticPages: MenuItem[] = [
  {
    title: "Admin",
    url: "/admin",
    icon: ShieldUser,
  },
];

const iconByGenre = {
  "sci-fi": Orbit,
  fantasy: Wand,
};

export function AppSidebar() {
  const activePage = usePathname();
  const { data: rawBookLists, isLoading: isBookListsLoading } = useQuery({
    queryKey: ["book-lists"],
    queryFn: getBookLists,
  });

  const bookListMenu = useMemo(() => {
    const sortedYears: string[] = [];
    const unorderedBookListByYear: Record<string | number, MenuItem> = {};
    for (const { year, genre } of rawBookLists ?? []) {
      const yearStr = year.toString();
      if (!unorderedBookListByYear[year]) {
        sortedYears.push(yearStr);
        unorderedBookListByYear[year] = {
          title: yearStr,
          url: `/book-lists/${year}`,
          icon: null,
          children: [],
        };
      }
      unorderedBookListByYear[year].children!.push({
        title: capitalize(genre),
        url: `/book-lists/${year}/${genre}`,
        icon: iconByGenre[genre as keyof typeof iconByGenre] ?? null,
      });
    }

    return sortedYears.map((year) => {
      const bookList = unorderedBookListByYear[year];
      bookList.children!.push({
        title: "Books",
        url: `/book-lists/${year}/books`,
        icon: BookCopy,
      });
      return bookList;
    });
  }, [rawBookLists]);

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Link href="/" className="flex gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Image
                    src="/sffvektor-logo.svg"
                    width={30}
                    height={30}
                    alt="SFFVektor logo"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">SFFVektor</span>
                  <span className="text-xs">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <NestableMenuItem activePage={activePage} items={staticPages} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Book lists</SidebarGroupLabel>
          <SidebarGroupContent>
            <NestableMenuItem activePage={activePage} items={bookListMenu} />
            {isBookListsLoading && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Skeleton className="h-6 w-full rounded-md" />
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <Skeleton className="h-6 w-full rounded-md" />
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <Skeleton className="h-6 w-full rounded-md" />
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <Skeleton className="h-6 w-full rounded-md" />
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <AuthButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function NestableMenuItem({
  activePage,
  items,
}: {
  activePage: string;
  items: MenuItem[];
}) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <div key={item.url}>
          {(item.children?.length && (
            <Collapsible
              asChild
              defaultOpen={activePage.startsWith(item.url)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={activePage.startsWith(item.url)}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.children?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.url}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={item.url === activePage}
                        >
                          <Link href={subItem.url}>
                            {subItem.icon && <subItem.icon />}
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )) || (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={item.url === activePage}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </div>
      ))}
    </SidebarMenu>
  );
}
