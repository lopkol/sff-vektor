"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBookList,
  deleteBookList,
  getBookList,
  updateBookList,
} from "@/services/book-lists";
import { useTranslations } from "next-intl";
import { BookListForm } from "./book-list-form";
import { useToast } from "@/hooks/use-toast";
import { AxiosError } from "axios";
import { ApiError } from "@/types/api-error";
import { CreateBookList } from "@/types/book-list";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";

interface BookListDialogProps {
  onOpenChange: (open: boolean) => void;
  year?: number;
  genre?: "sci-fi" | "fantasy";
}

export function BookListDialog(
  { onOpenChange, year, genre }: BookListDialogProps,
) {
  const t = useTranslations("Admin.BookLists");
  const tTools = useTranslations("Tools");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bookList, isLoading } = useQuery({
    queryKey: ["book-list", year, genre],
    queryFn: () => getBookList(year!, genre!),
    enabled: !!year && !!genre,
    refetchOnMount: "always",
  });

  const { mutate: createOrUpdateBooklist, isPending: isSavingPending } =
    useMutation({
      mutationFn: (formData: CreateBookList) =>
        bookList ? updateBookList(formData) : createBookList(formData),
      onSuccess: (updatedBookList) => {
        queryClient.invalidateQueries({ queryKey: ["book-lists"] });
        queryClient.setQueryData([
          "book-list",
          updatedBookList.year,
          updatedBookList.genre,
        ], updatedBookList);
        toast({
          title: bookList ? tTools("updateSuccess") : tTools("saveSuccess"),
          variant: "success",
        });
        onOpenChange(false);
      },
      onError: (error: AxiosError<ApiError>) => {
        toast({
          title: bookList ? tTools("updateError") : tTools("saveError"),
          description: t.has("error." + error.response?.data.code as any)
            ? t("error." + error.response?.data.code as any)
            : tTools("unknownError"),
          variant: "destructive",
        });
      },
    });

  const { mutate: removeBookList, isPending: isDeletingPending } = useMutation({
    mutationFn: (
      { year, genre }: { year: number; genre: "sci-fi" | "fantasy" },
    ) => deleteBookList(year, genre),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-lists"] });
      queryClient.removeQueries({ queryKey: ["book-list", year, genre] });
      toast({
        title: tTools("deleteSuccess"),
        variant: "success",
      });
      onOpenChange(false);
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({
        title: tTools("deleteError"),
        description: t.has("error." + error.response?.data.code as any)
          ? t("error." + error.response?.data.code as any)
          : tTools("unknownError"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateBookList) => {
    createOrUpdateBooklist(data);
  };

  const onDelete = () => {
    if (bookList) {
      removeBookList({ year: bookList.year, genre: bookList.genre });
    }
  };

  const content = (
    <>
      <div className="mt-6">
        {isLoading
          ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-8 w-full" />
            </div>
          )
          : (
            <BookListForm
              bookList={bookList}
              isSaving={isSavingPending}
              onOpenChange={onOpenChange}
              onSubmit={onSubmit}
              onDelete={onDelete}
            />
          )}
      </div>
    </>
  );

  return (
    <ResponsiveDialog open={true} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent side="right">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {bookList ? t("dialog.editTitle") : t("dialog.createTitle")}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        {content}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
