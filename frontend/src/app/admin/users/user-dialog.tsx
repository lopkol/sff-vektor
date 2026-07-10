"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, getUser, updateUser } from "@/services/users";
import { UserForm } from "./user-form";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { User, UserForm as UserFormType } from "@/types/user";
import { useState } from "react";
import { useUnsavedChangesConfirm } from "@/hooks/use-unsaved-changes-confirm";

interface UserDialogProps {
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserDialog({ onOpenChange, user }: UserDialogProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("Admin.Users");
  const tTools = useTranslations("Tools");
  const [isDirty, setIsDirty] = useState(false);
  const { guardedOnOpenChange, confirmDialog } = useUnsavedChangesConfirm(
    isDirty,
    onOpenChange,
  );

  // If editing, fetch the latest user data
  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () => (user ? getUser(user.id) : undefined),
    enabled: !!user,
    refetchOnMount: "always",
  });

  const { mutate: createOrUpdateUser, isPending: isSavingPending } =
    useMutation({
      mutationFn: (formData: UserFormType) =>
        user
          ? updateUser(user.id, { ...formData, molyUsername: formData.name })
          : createUser({
            ...formData,
            molyUsername: formData.name,
            isActive: true,
          }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.invalidateQueries({ queryKey: ["readers"] });
        toast.success(user ? tTools("updateSuccess") : tTools("saveSuccess"));
        onOpenChange(false);
      },
      onError: (error: AxiosError<{ code: string }>) => {
        toast.error(user ? tTools("updateError") : tTools("saveError"), {
          description: error.message,
        });
      },
    });

  const onSubmit = (data: UserFormType) => {
    createOrUpdateUser(data);
  };

  return (
    <ResponsiveDialog open={true} onOpenChange={guardedOnOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {user ? t("dialog.editTitle") : t("dialog.createTitle")}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <div className="mt-4">
          {isLoading
            ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-full" />
              </div>
            )
            : (
              <UserForm
                user={userData || user || undefined}
                isSaving={isSavingPending}
                onOpenChange={guardedOnOpenChange}
                onSubmit={onSubmit}
                onDirtyChange={setIsDirty}
              />
            )}
        </div>
        {confirmDialog}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
