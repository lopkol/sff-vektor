"use client";

import Image from "next/image";
import { Wand, Orbit, BookCopy, ShieldUser, ChevronRight } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
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

const mainPages: MenuItem[] = [
  {
    title: "Admin",
    url: "/admin",
    icon: ShieldUser,
  },
];

const bookLists: MenuItem[] = [
  {
    title: "2020",
    url: "/book-lists/2020",
    icon: null,
    children: [
      {
        title: "Sci-fi",
        url: "/book-lists/2020/sci-fi",
        icon: Orbit,
      },
      {
        title: "Fantasy",
        url: "/book-lists/2020/fantasy",
        icon: Wand,
      },
      {
        title: "Books",
        url: "/book-lists/2020/books",
        icon: BookCopy,
      },
    ],
  },
];

export function AppSidebar() {
  const activePage = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
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
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <NestableMenuItem activePage={activePage} items={mainPages} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Book lists</SidebarGroupLabel>
          <SidebarGroupContent>
            <NestableMenuItem activePage={activePage} items={bookLists} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
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
                          <a href={subItem.url}>
                            {subItem.icon && <subItem.icon />}
                            <span>{subItem.title}</span>
                          </a>
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
                <a href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </div>
      ))}
    </SidebarMenu>
  );
}
