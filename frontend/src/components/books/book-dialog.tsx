"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBook, deleteBook, getBook, updateBook } from "@/services/books";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { BookForm } from "./book-form";
import { CreateBook } from "@/types/book";
import { Genre } from "@/types/book-list";
import { Skeleton } from "@/components/ui/skeleton";

interface BookDialogProps {
  onOpenChange: (open: boolean) => void;
  bookId?: string;
  defaultYear?: number;
  defaultGenre?: Genre | null;
  onSuccess: () => void;
}

export function BookDialog(
  { onOpenChange, bookId, defaultYear, defaultGenre, onSuccess }:
    BookDialogProps,
) {
  const t = useTranslations("BookList.Admin");
  const tTools = useTranslations("Tools");
  const queryClient = useQueryClient();
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
      toast.success(bookId ? tTools("updateSuccess") : tTools("saveSuccess"));
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast.error(bookId ? tTools("updateError") : tTools("saveError"), {
        description: tTools("unknownError"),
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
                defaultYear={defaultYear}
                defaultGenre={defaultGenre}
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
