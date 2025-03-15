"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
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
import { useIsMobile } from "@/hooks/use-mobile";

export type AppNavbarProps = {
  rootPages: Pick<MenuItem, "title" | "url" | "icon">[];
  subPages: MenuItem[];
  rootUrl: string;
};

function AppBreadcrumb({
  rootPages,
}: {
  rootPages: Pick<MenuItem, "title" | "url" | "icon">[];
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {rootPages.map((item, index) => (
          <Fragment key={item.title}>
            <BreadcrumbItem>
              {(index === 0 && <strong>{item.title}</strong>) ||
                (index === rootPages.length - 1 && (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                )) ||
                (item.url !== "#" && (
                  <BreadcrumbLink href={item.url}>{item.title}</BreadcrumbLink>
                )) ||
                item.title}
            </BreadcrumbItem>
            {index !== rootPages.length - 1 && (
              <BreadcrumbSeparator key={item.title} />
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AppNavbar({ rootPages, subPages, rootUrl }: AppNavbarProps) {
  const activePage = usePathname();
  const rootPage = rootPages[rootPages.length - 1];
  const isMobile = useIsMobile();

  return (
    <header className="flex flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          {!isMobile && (
            <>
              <Separator orientation="vertical" className="mr-2 h-4" />
              <AppBreadcrumb rootPages={rootPages} />
            </>
          )}
        </div>

        <div className="flex justify-center grow gap-2 md:px-4 px-2">
          <NavigationMenu>
            <NavigationMenuList>
              {subPages.map((item) => (
                <NavigationMenuItem key={item.url}>
                  <Link href={`${rootUrl}${item.url}`} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(navigationMenuTriggerStyle(), {
                        "flex items-center gap-2": !!item.icon,
                        "underline bg-accent":
                          activePage === `${rootPage.url}${item.url}`,
                      })}
                    >
                      {item.icon && <item.icon />}
                      {(!isMobile || !item.icon) && item.title}
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
      </div>
      {isMobile && (
        <div className="flex h-10 shrink-0 items-start gap-2 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <AppBreadcrumb rootPages={rootPages} />
        </div>
      )}
    </header>
  );
}
