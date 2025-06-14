"use client";

import { Button } from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultipleSelector from "@/components/ui/multiple-selector";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
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
import { useMemo, useState } from "react";
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
}

export function BookListForm(
  { bookList, isSaving, onOpenChange, onSubmit, onDelete }: BookListFormProps,
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

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      year: bookList?.year ?? new Date().getFullYear(),
      genre: bookList?.genre ?? "sci-fi",
      url: bookList?.url ?? "",
      pendingUrl: bookList?.pendingUrl ?? "",
      readers: bookList?.readers ?? [],
    },
  });

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Controller
          name="year"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="year">{t("props.year")}</Label>
              <Input
                id="year"
                {...field}
                type="number"
                disabled={!!bookList}
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? parseInt(e.target.value) : "",
                  )}
              />
              <FormErrorMessage>{errors.year?.message}</FormErrorMessage>
            </>
          )}
        />
      </div>
      <div className="space-y-2">
        <Controller
          name="genre"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="genre">{t("props.genre")}</Label>
              <Select
                {...field}
                disabled={!!bookList}
                onValueChange={(value) => field.onChange(value as Genre)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("props.genre")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sci-fi">
                    {tTools("genres.sciFi")}
                  </SelectItem>
                  <SelectItem value="fantasy">
                    {tTools("genres.fantasy")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormErrorMessage>{errors.genre?.message}</FormErrorMessage>
            </>
          )}
        />
      </div>
      <div className="space-y-2">
        <Controller
          name="url"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="url">{t("props.url")}</Label>
              <Input
                id="url"
                {...field}
              />
              <FormErrorMessage>{errors.url?.message}</FormErrorMessage>
            </>
          )}
        />
      </div>
      <div className="space-y-2">
        <Controller
          name="pendingUrl"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="pendingUrl">{t("props.pendingUrl")}</Label>
              <Input
                id="pendingUrl"
                {...field}
                value={field.value ?? ""}
                onChange={(pendingUrl) => field.onChange(pendingUrl || null)}
              />
              <FormErrorMessage>{errors.pendingUrl?.message}</FormErrorMessage>
            </>
          )}
        />
      </div>
      <div className="space-y-2">
        <Controller
          name="readers"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="readers">{t("props.readers")}</Label>
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
              <FormErrorMessage>{errors.readers?.message}</FormErrorMessage>
            </>
          )}
        />
      </div>
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
                      <AlertDialogCancel>{tTools("cancel")}</AlertDialogCancel>
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
  );
}
