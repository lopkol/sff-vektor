"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function ResponsiveDialog(
  { open, onOpenChange, children }: ResponsiveDialogProps,
) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children}
    </Sheet>
  );
}

interface ResponsiveDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetContent> {
  side?: "top" | "right" | "bottom" | "left";
}

export function ResponsiveDialogContent(
  { className, children, side = "right", ...props }:
    ResponsiveDialogContentProps,
) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <DrawerContent
        className={cn(
          "flex h-full w-full flex-col",
          className,
        )}
        {...props}
      >
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </DrawerContent>
    );
  }

  return (
    <SheetContent
      side={side}
      className={cn(
        "flex h-full w-full flex-col sm:max-w-[540px] sm:w-[540px]",
        className,
      )}
      {...props}
    >
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </SheetContent>
  );
}

export function ResponsiveDialogHeader(
  { className, ...props }: React.HTMLAttributes<HTMLDivElement>,
) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerHeader className={className} {...props} />;
  }

  // Zero out SheetHeader's own v4 padding so the header aligns with the body
  // (both inset by the content wrapper's p-6), and reserve space on the right
  // so header actions clear the absolutely-positioned close button.
  return <SheetHeader className={cn("p-0 pr-8", className)} {...props} />;
}

export function ResponsiveDialogTitle(
  { className, ...props }: React.HTMLAttributes<HTMLHeadingElement>,
) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerTitle className={className} {...props} />;
  }

  return <SheetTitle className={className} {...props} />;
}
