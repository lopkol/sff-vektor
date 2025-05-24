"use client";

import { useTranslations } from "next-intl";
import { Author, CreateAuthor } from "@/types/author";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormErrorMessage } from "@/components/ui/form";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useMemo } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { createAuthor, updateAuthor } from "@/services/authors";

interface AuthorFormDialogProps {
  onOpenChange: (open: boolean) => void;
  author?: Author;
  onSuccess: () => void;
}

export function AuthorFormDialog(
  { onOpenChange, author, onSuccess }: AuthorFormDialogProps,
) {
  const t = useTranslations("BookList.Admin");
  const tTools = useTranslations("Tools");

  const schema = useMemo(() => {
    return z.object({
      displayName: z.string().nonempty(t("error.authorNameRequired")),
      sortName: z.string().nonempty(t("error.authorSortNameRequired")),
      isApproved: z.boolean(),
      url: z.string().nullable().optional(),
    }) satisfies z.ZodSchema<CreateAuthor>;
  }, [t]);

  const form = useForm<CreateAuthor>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: "",
      sortName: "",
      isApproved: false,
      url: null,
    },
  });

  // Reset form when author changes
  useEffect(() => {
    if (author) {
      form.reset({
        displayName: author.displayName,
        sortName: author.sortName,
        isApproved: author.isApproved,
        url: author.url,
      });
    } else {
      form.reset({
        displayName: "",
        sortName: "",
        isApproved: false,
        url: null,
      });
    }
  }, [author, form]);

  const handleSubmit: SubmitHandler<CreateAuthor> = async (data) => {
    try {
      const authorData: CreateAuthor = {
        displayName: data.displayName,
        sortName: data.sortName,
        isApproved: data.isApproved,
        url: data.url,
      };
      if (author) {
        await updateAuthor(author.id, authorData);
      } else {
        await createAuthor(authorData);
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to save author:", error);
    }
  };

  return (
    <ResponsiveDialog open={true} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {author ? t("props.editAuthor") : t("props.addAuthor")}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("props.authorName")}</Label>
            <Input
              id="name"
              {...form.register("displayName")}
            />
            <FormErrorMessage>
              {form.formState.errors.displayName?.message}
            </FormErrorMessage>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortName">{t("props.authorSortName")}</Label>
            <Input
              id="sortName"
              {...form.register("sortName")}
            />
            <FormErrorMessage>
              {form.formState.errors.sortName?.message}
            </FormErrorMessage>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tTools("cancel")}
            </Button>
            <Button type="submit">
              {tTools("save")}
            </Button>
          </div>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
