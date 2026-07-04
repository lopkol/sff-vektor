"use client";

import { useTranslations } from "next-intl";
import { Book, CreateBook } from "@/types/book";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState } from "react";
import { SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectContent, SelectItem } from "@/components/ui/select";
import { Select } from "@/components/ui/select";
import { Genre } from "@/types/book-list";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { AlertDialogContent } from "@/components/ui/alert-dialog";
import { BookAlternativeInput } from "@/app/book-lists/[year]/[genre]/admin/book-alternative-input";
import { Author } from "@/types/author";
import { getAuthors } from "@/services/authors";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import MultipleSelector from "@/components/ui/multiple-selector";
import { AuthorManagementDialog } from "./author-management-dialog";
import { Settings2 } from "lucide-react";
import { useBookListYear } from "@/app/book-lists/[year]/book-list-year-provider";
import { useBookListGenre } from "@/app/book-lists/[year]/[genre]/book-list-genre-provider";
import { Switch } from "@/components/ui/switch";

interface BookFormProps {
  book?: Book;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBook) => void;
  onDelete: () => void;
}

export function BookForm({
  book,
  isSaving,
  onOpenChange,
  onSubmit,
  onDelete,
}: BookFormProps) {
  const t = useTranslations("BookList.Admin");
  const tTools = useTranslations("Tools");
  const { year } = useBookListYear();
  const { genre } = useBookListGenre();
  const [isAuthorDialogOpen, setIsAuthorDialogOpen] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        year: z.number({ message: t("error.year") }).min(1900, {
          message: t("error.yearMin"),
        }),
        genre: z.enum(["sci-fi", "fantasy"] as const).nullable().optional(),
        title: z.string().nonempty({ message: t("error.titleRequired") }),
        series: z.string().nullable().optional(),
        seriesNumber: z.string().nullable().optional(),
        isApproved: z.boolean(),
        isPending: z.boolean(),
        alternatives: z.array(z.object({
          name: z.string().nonempty({ message: t("error.nameRequired") }),
          urls: z.array(z.string().url({ message: t("error.url") })),
        })),
        authors: z.array(z.string()),
      }) satisfies z.ZodSchema<CreateBook>,
    [t],
  );

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: authors, isLoading } = useQuery({
    queryKey: ["authors"],
    queryFn: () => getAuthors(), // TODO: pagination
  });

  const authorsById = useMemo(() => {
    return authors?.reduce((acc, author) => {
      acc[author.id] = author;
      return acc;
    }, {} as Record<string, Author>);
  }, [authors]);

  const form = useForm<CreateBook>({
    resolver: zodResolver(schema),
    defaultValues: {
      year: book?.year ?? year,
      genre: book?.genre ?? genre,
      title: book?.title ?? "",
      series: book?.series ?? null,
      seriesNumber: book?.seriesNumber ?? null,
      alternatives: book?.alternatives ?? [],
      authors: book?.authors ?? [],
      isApproved: book?.isApproved ?? true,
      isPending: book?.isPending ?? false,
    },
  });
  const bookAuthors = form.watch("authors");

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    onDelete();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="isApproved"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>{t("props.approved")}</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPending"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>{t("props.pending")}</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("props.year")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    value={Number.isNaN(field.value) ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("props.genre")}</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value as Genre | null)}
                  value={field.value ?? undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("props.genre")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sci-fi">
                      {tTools("genres.sciFi")}
                    </SelectItem>
                    <SelectItem value="fantasy">
                      {tTools("genres.fantasy")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="authors"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>{t("props.authors")}</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAuthorDialogOpen(true)}
                    title={t("form.manageAuthors")}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
                <MultipleSelector
                  value={field.value.map((id: string) => ({
                    label: (
                      authorsById?.[id]?.isApproved ? "" : "⚠️ "
                    ) + authorsById?.[id]?.displayName,
                    value: id,
                    key: id,
                  }))}
                  onChange={(value) =>
                    field.onChange(value.map((v) => v.value))}
                  options={authors?.map((author: Author) => ({
                    label: (
                      author.isApproved ? "" : "⚠️ "
                    ) + author.displayName,
                    value: author.id,
                    key: author.id,
                  })) || []}
                  hidePlaceholderWhenSelected
                  placeholder={t("props.authors")}
                  emptyIndicator={
                    <p className="text-center text-muted-foreground">
                      {tTools("noResults")}
                    </p>
                  }
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("props.title")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="series"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("props.series")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seriesNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("props.seriesNumber")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <BookAlternativeInput control={form.control} />
          </div>

          <div className="flex justify-between space-x-2">
            <div>
              {book && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSaving}
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  {tTools("delete")}
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tTools("cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? tTools("saving") : tTools("save")}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {isDeleteDialogOpen && (
        <AlertDialog open={true} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("dialog.deleteConfirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("dialog.deleteConfirmMessage")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {tTools("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                {tTools("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isAuthorDialogOpen && (
        <AuthorManagementDialog
          onOpenChange={setIsAuthorDialogOpen}
          authorIdsToDisplay={bookAuthors ?? []}
          onAuthorCreated={(authorId) => {
            form.setValue("authors", [...form.getValues("authors"), authorId]);
          }}
        />
      )}
    </>
  );
}
