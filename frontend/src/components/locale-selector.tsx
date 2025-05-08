"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supportedLocales } from "@/i18n/locales";
import { Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export function LocaleSelector({ className }: { className?: string }) {
  const pathname = usePathname();
  const currentLocale = useLocale();
  const [selectedLocale, setSelectedLocale] = useState<string | null>(null);
  useState<string | null>(null);
  const locales = supportedLocales;
  const updateLocale = () => {
    window.location.href = `${pathname}?updateLocale=${selectedLocale}`;
  };

  return (
    <>
      {!!selectedLocale && (
        <ConfirmLocaleUpdate
          onConfirm={updateLocale}
          onCancel={() => setSelectedLocale(null)}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild className={className}>
          <Button variant="outline" size="icon">
            <div className="h-[1.2rem] w-[1.2rem]">
              {currentLocale.toUpperCase()}
            </div>
            <span className="sr-only">Toggle locale</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {locales.map((locale) => (
            <DropdownMenuItem
              key={locale}
              onClick={() => setSelectedLocale(locale)}
            >
              {locale === currentLocale && <Check className="h-4 w-4" />}{" "}
              {locale.toUpperCase()}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function ConfirmLocaleUpdate({
  onConfirm,
  onCancel,
}: { onConfirm: () => void; onCancel: () => void }) {
  const t = useTranslations("LocaleSelector");
  const tTools = useTranslations("Tools");

  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {tTools("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {tTools("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
