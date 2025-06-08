"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAuthor,
  deleteAuthor,
  getAuthor,
  updateAuthor,
} from "@/services/authors";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { AuthorForm } from "@/app/book-lists/[year]/[genre]/admin/author-form";
import { CreateAuthor } from "@/types/author";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthorDialogProps {
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  authorId?: string;
  onAuthorCreated?: (authorId: string) => void;
}

export function AuthorDialog(
  { onOpenChange, onSuccess, authorId, onAuthorCreated }: AuthorDialogProps,
) {
  const t = useTranslations("BookList.Admin");
  const tTools = useTranslations("Tools");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: author, isLoading } = useQuery({
    queryKey: ["author", authorId],
    queryFn: () => getAuthor(authorId!),
    enabled: !!authorId,
    refetchOnMount: "always",
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
      toast({
        title: authorId ? tTools("updateSuccess") : tTools("saveSuccess"),
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: authorId ? tTools("updateError") : tTools("saveError"),
        description: tTools("unknownError"),
        variant: "destructive",
      });
    },
  });

  const { mutate: removeAuthor, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteAuthor(authorId!),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["author", authorId] });
      toast({
        title: tTools("deleteSuccess"),
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: tTools("deleteError"),
        description: tTools("unknownError"),
        variant: "destructive",
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
    <ResponsiveDialog open={true} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {authorId ? t("authors.edit") : t("authors.add")}
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
                onOpenChange={onOpenChange}
                onSubmit={onSubmit}
                onDelete={onDelete}
              />
            )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
