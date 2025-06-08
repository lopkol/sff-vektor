"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBook, deleteBook, getBook, updateBook } from "@/services/books";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { BookForm } from "./book-form";
import { CreateBook } from "@/types/book";
import { Skeleton } from "@/components/ui/skeleton";

interface BookDialogProps {
  onOpenChange: (open: boolean) => void;
  bookId?: string;
  onSuccess: () => void;
}

export function BookDialog(
  { onOpenChange, bookId, onSuccess }: BookDialogProps,
) {
  const t = useTranslations("BookList.Admin");
  const tTools = useTranslations("Tools");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => getBook(bookId!),
    enabled: !!bookId,
    refetchOnMount: "always",
  });

  const { mutate: createOrUpdateBook, isPending: isSaving } = useMutation({
    mutationFn: (data: CreateBook) =>
      bookId ? updateBook(bookId, data) : createBook(data),
    onSuccess: (updatedBook) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      if (bookId) {
        queryClient.setQueryData(["book", bookId], updatedBook);
      }
      toast({
        title: bookId ? tTools("updateSuccess") : tTools("saveSuccess"),
        variant: "success",
      });
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: bookId ? tTools("updateError") : tTools("saveError"),
        description: tTools("unknownError"),
        variant: "destructive",
      });
    },
  });

  const { mutate: removeBook, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteBook(bookId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["books", book!.year, book!.genre],
      });
      queryClient.removeQueries({ queryKey: ["book", bookId] });
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

  const onSubmit = (data: CreateBook) => {
    createOrUpdateBook(data);
  };

  const onDelete = () => {
    if (bookId) {
      removeBook();
    }
  };

  return (
    <ResponsiveDialog open={true} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent side="right">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {bookId ? t("dialog.editTitle") : t("dialog.createTitle")}
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
              <BookForm
                book={book}
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
