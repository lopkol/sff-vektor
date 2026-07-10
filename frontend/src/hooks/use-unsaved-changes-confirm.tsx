"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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

/**
 * Guards an editable dialog against losing unsaved changes.
 *
 * Wrap the dialog's `onOpenChange` (and the form's Cancel handler) with the
 * returned `guardedOnOpenChange`: when `isDirty` is true, a close attempt shows
 * a confirmation instead of closing. Programmatic closes after a successful
 * save/delete should call the raw `onOpenChange(false)` directly to bypass it.
 */
export function useUnsavedChangesConfirm(
  isDirty: boolean,
  onOpenChange: (open: boolean) => void,
) {
  const t = useTranslations("Tools");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const guardedOnOpenChange = (open: boolean) => {
    if (!open && isDirty) {
      setIsConfirmOpen(true);
      return;
    }
    onOpenChange(open);
  };

  const confirmDialog = (
    <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("unsavedChangesTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("unsavedChangesDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("keepEditing")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            {t("discard")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { guardedOnOpenChange, confirmDialog };
}
