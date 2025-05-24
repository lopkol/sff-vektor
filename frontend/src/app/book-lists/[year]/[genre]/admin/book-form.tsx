"use client";

import { useTranslations } from "next-intl";
import { Book, CreateBook } from "@/types/book";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormErrorMessage } from "@/components/ui/form";
import { Controller, FormProvider, useForm } from "react-hook-form";
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

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<CreateBook>({
    resolver: zodResolver(schema),
    defaultValues: {
      year: book?.year ?? new Date().getFullYear(),
      genre: book?.genre ?? null,
      title: book?.title ?? "",
      series: book?.series ?? null,
      seriesNumber: book?.seriesNumber ?? null,
      alternatives: book?.alternatives ?? [],
      authors: book?.authors ?? [],
      isApproved: book?.isApproved ?? false,
      isPending: book?.isPending ?? false,
    },
  });

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    onDelete();
  };

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
                onValueChange={(value) => field.onChange(value as Genre | null)}
                value={field.value ?? undefined}
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
          name="title"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="title">{t("props.title")}</Label>
              <Input
                id="title"
                {...field}
              />
              <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            </>
          )}
        />
      </div>

      <div className="space-y-2">
        <Controller
          name="series"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="series">{t("props.series")}</Label>
              <Input
                id="series"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
              />
              <FormErrorMessage>{errors.series?.message}</FormErrorMessage>
            </>
          )}
        />
      </div>

      <div className="space-y-2">
        <Controller
          name="seriesNumber"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="seriesNumber">{t("props.seriesNumber")}</Label>
              <Input
                id="seriesNumber"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
              />
              <FormErrorMessage>
                {errors.seriesNumber?.message}
              </FormErrorMessage>
            </>
          )}
        />
      </div>

      <div className="space-y-2">
        <BookAlternativeInput
          control={control}
          errors={errors}
        />
      </div>

      <div className="flex justify-between space-x-2">
        <div>
          {book && (
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
  );
}
