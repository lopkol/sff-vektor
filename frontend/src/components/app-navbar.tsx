"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DarkLightModeSelector } from "@/components/dark-light-mode-selector";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { MenuItem } from "@/lib/menu-item";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Fragment } from "react";

export type AppNavbarProps = {
  rootPages: Pick<MenuItem, "title" | "url" | "icon">[];
  subPages: MenuItem[];
};

export function AppNavbar({ rootPages, subPages }: AppNavbarProps) {
  const activePage = usePathname();
  const rootPage = rootPages[rootPages.length - 1];

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {rootPages.map((item, index) => (
              <Fragment key={item.title}>
                <BreadcrumbItem className="hidden md:block">
                  {(index === 0 && <strong>{item.title}</strong>) ||
                    (index === rootPages.length - 1 && (
                      <BreadcrumbPage>{item.title}</BreadcrumbPage>
                    )) ||
                    item.title}
                </BreadcrumbItem>
                {index !== rootPages.length - 1 && (
                  <BreadcrumbSeparator
                    key={item.title}
                    className="hidden md:block"
                  />
                )}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex justify-center grow gap-2 px-4">
        <NavigationMenu>
          <NavigationMenuList>
            {subPages.map((item) => (
              <NavigationMenuItem key={item.url}>
                <Link
                  href={`${rootPage.url}${item.url}`}
                  legacyBehavior
                  passHref
                >
                  <NavigationMenuLink
                    className={cn(navigationMenuTriggerStyle(), {
                      "underline bg-accent":
                        activePage === `${rootPage.url}${item.url}`,
                    })}
                  >
                    {item.icon && <item.icon />}
                    {item.title}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="flex justify-end grow gap-2 px-4">
        <DarkLightModeSelector />
      </div>
    </header>
  );
}
