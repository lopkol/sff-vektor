"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultipleSelector from "@/components/ui/multiple-selector";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useEffect, useMemo, useState } from "react";
import { BookList, CreateBookList, Genre } from "@/types/book-list";
import { useQuery } from "@tanstack/react-query";
import { getReaders } from "@/services/readers";
import { Reader } from "@/types/reader";
import { Skeleton } from "@/components/ui/skeleton";

interface BookListFormProps {
  bookList?: BookList;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBookList) => void;
  onDelete: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function BookListForm(
  { bookList, isSaving, onOpenChange, onSubmit, onDelete, onDirtyChange }:
    BookListFormProps,
) {
  const t = useTranslations("Admin.BookLists");
  const tTools = useTranslations("Tools");

  const schema = useMemo(
    () =>
      z.object({
        year: z
          .number({ message: t("error.year") })
          .min(1900, { message: t("error.yearMin") }),
        genre: z.enum(["sci-fi", "fantasy"]),
        url: z.string().url({ message: t("error.url") }),
        pendingUrl: z.string().url({ message: t("error.pendingUrl") }).or(
          z.literal("").nullable(),
        ),
        readers: z.array(z.string()),
      }) satisfies z.ZodSchema<CreateBookList>,
    [],
  );

  const { data: readers, isLoading } = useQuery({
    queryKey: ["readers"],
    queryFn: () => getReaders(),
  });

  const readersById = useMemo(() => {
    return readers?.reduce((acc, reader) => {
      acc[reader.id] = reader;
      return acc;
    }, {} as Record<string, Reader>);
  }, [readers]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<CreateBookList>({
    resolver: zodResolver(schema),
    defaultValues: {
      year: bookList?.year ?? new Date().getFullYear(),
      genre: bookList?.genre ?? "sci-fi",
      url: bookList?.url ?? "",
      pendingUrl: bookList?.pendingUrl ?? "",
      readers: bookList?.readers ?? [],
    },
  });

  const { isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    onDelete();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  disabled={!!bookList}
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
                value={field.value}
                disabled={!!bookList}
                onValueChange={(value) => field.onChange(value as Genre)}
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
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("props.url")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pendingUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("props.pendingUrl")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(pendingUrl) => field.onChange(pendingUrl || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="readers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("props.readers")}</FormLabel>
              <MultipleSelector
                value={field.value.map((id: string) => ({
                  label: readersById?.[id]?.molyUsername ?? "",
                  value: id,
                  key: id,
                }))}
                onChange={(value) => field.onChange(value.map((v) => v.value))}
                options={readers?.map((reader: Reader) => ({
                  label: reader.molyUsername,
                  value: reader.id,
                  key: reader.id,
                })) || []}
                hidePlaceholderWhenSelected
                placeholder={t("form.selectReaders")}
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
        <div className="flex justify-between space-x-2">
          <div>
            {bookList && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSaving}
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  {tTools("delete")}
                </Button>
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
              </>
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
  );
}
