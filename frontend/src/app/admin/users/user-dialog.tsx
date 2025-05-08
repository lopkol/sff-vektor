"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUser, createUser, updateUser } from "@/services/users";
import { UserForm } from "./user-form";
import { useToast } from "@/hooks/use-toast";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { User, UserForm as UserFormType } from "@/types/user";

interface UserDialogProps {
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserDialog({ onOpenChange, user }: UserDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations("Admin.Users");

  // If editing, fetch the latest user data
  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () => (user ? getUser(user.id) : undefined),
    enabled: !!user,
    refetchOnMount: "always",
  });

  const { mutate: createOrUpdateUser, isPending: isSavingPending } = useMutation({
    mutationFn: (formData: UserFormType) =>
      user
        ? updateUser(user.id, { ...formData, molyUsername: formData.name })
        : createUser({ ...formData, molyUsername: formData.name, isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: user ? t('toast.updateSuccess') : t('toast.createSuccess'),
        variant: 'success',
      });
      onOpenChange(false);
    },
    onError: (error: AxiosError<{ code: string }>) => {
      toast({
        title: user ? t('toast.updateError') : t('toast.createError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: UserFormType) => {
    createOrUpdateUser(data);
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? t('dialog.editTitle') : t('dialog.createTitle')}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex justify-end gap-2">
              <Skeleton className="h-10 w-[100px]" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
          </div>
        ) : (
          <UserForm
            user={userData || user || undefined}
            isSaving={isSavingPending}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
