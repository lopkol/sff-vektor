"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAuthor,
  deleteAuthor,
  getAuthor,
  updateAuthor,
} from "@/services/authors";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { AuthorForm } from "@/components/authors/author-form";
import { CreateAuthor } from "@/types/author";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useUnsavedChangesConfirm } from "@/hooks/use-unsaved-changes-confirm";

interface AuthorDialogProps {
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  authorId?: string;
  onAuthorCreated?: (authorId: string) => void;
}

export function AuthorDialog(
  { onOpenChange, onSuccess, authorId, onAuthorCreated }: AuthorDialogProps,
) {
  const t = useTranslations("Authors");
  const tTools = useTranslations("Tools");
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);
  const { guardedOnOpenChange, confirmDialog } = useUnsavedChangesConfirm(
    isDirty,
    onOpenChange,
  );
  const { data: author, isLoading } = useQuery({
    queryKey: ["author", authorId],
    queryFn: () => getAuthor(authorId!),
    enabled: !!authorId,
  });

  const { mutate: createOrUpdateAuthor, isPending: isSaving } = useMutation({
    mutationFn: (data: CreateAuthor) =>
      authorId ? updateAuthor(authorId, data) : createAuthor(data),
    onSuccess: (updatedAuthor) => {
      if (authorId) {
        queryClient.setQueryData(["author", authorId], updatedAuthor);
      } else if (onAuthorCreated) {
        onAuthorCreated(updatedAuthor.id);
      }
      toast.success(
        authorId ? tTools("updateSuccess") : tTools("saveSuccess"),
      );
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast.error(authorId ? tTools("updateError") : tTools("saveError"), {
        description: tTools("unknownError"),
      });
    },
  });

  const { mutate: removeAuthor, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteAuthor(authorId!),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["author", authorId] });
      toast.success(tTools("deleteSuccess"));
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast.error(tTools("deleteError"), {
        description: tTools("unknownError"),
      });
    },
  });

  const onSubmit = (data: CreateAuthor) => {
    createOrUpdateAuthor(data);
  };

  const onDelete = () => {
    if (authorId) {
      removeAuthor();
    }
  };

  return (
    <ResponsiveDialog open={true} onOpenChange={guardedOnOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {authorId ? t("edit") : t("add")}
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
              <AuthorForm
                author={author}
                isSaving={isSaving}
                onOpenChange={guardedOnOpenChange}
                onSubmit={onSubmit}
                onDelete={onDelete}
                onDirtyChange={setIsDirty}
              />
            )}
        </div>
        {confirmDialog}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
