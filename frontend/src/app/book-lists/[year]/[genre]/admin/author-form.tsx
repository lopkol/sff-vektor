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
import { useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
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

interface AuthorFormProps {
  author?: Author;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateAuthor) => void;
  onDelete: () => void;
}

export function AuthorForm({
  author,
  isSaving,
  onOpenChange,
  onSubmit,
  onDelete,
}: AuthorFormProps) {
  const t = useTranslations("BookList.Admin");
  const tTools = useTranslations("Tools");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const schema = useMemo(() => {
    return z.object({
      displayName: z.string().nonempty(t("error.authorNameRequired")),
      sortName: z.string().nonempty(t("error.authorSortNameRequired")),
      isApproved: z.boolean(),
      url: z.string().url({ message: t("error.url") }).or(
        z.literal("").nullable().optional(),
      ),
    }) satisfies z.ZodSchema<CreateAuthor>;
  }, [t]);

  const form = useForm<CreateAuthor>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: author?.displayName ?? "",
      sortName: author?.sortName ?? "",
      isApproved: author?.isApproved ?? true,
      url: author?.url ?? null,
    },
  });

  const handleSubmit: SubmitHandler<CreateAuthor> = async (data) => {
    onSubmit(data);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    onDelete();
  };

  return (
    <>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="isApproved">{t("props.approved")}</Label>
            <Switch
              id="isApproved"
              checked={form.watch("isApproved")}
              onCheckedChange={(checked: boolean) => {
                form.setValue("isApproved", checked);
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">{t("authors.name")}</Label>
          <Input
            id="displayName"
            {...form.register("displayName")}
          />
          <FormErrorMessage>
            {form.formState.errors.displayName?.message}
          </FormErrorMessage>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortName">{t("authors.sortName")}</Label>
          <Input
            id="sortName"
            {...form.register("sortName")}
          />
          <FormErrorMessage>
            {form.formState.errors.sortName?.message}
          </FormErrorMessage>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">{t("authors.url")}</Label>
          <Input
            id="url"
            {...form.register("url")}
          />
          <FormErrorMessage>
            {form.formState.errors.url?.message}
          </FormErrorMessage>
        </div>

        <div className="flex justify-between">
          {author && (
            <Button
              type="button"
              variant="destructive"
              disabled={isSaving}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              {tTools("delete")}
            </Button>
          )}
          <div className="flex space-x-2 ml-auto">
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

      {isDeleteDialogOpen && author && (
        <AlertDialog
          open={true}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("dialog.deleteAuthorConfirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("dialog.deleteAuthorConfirmMessage", {
                  name: author.displayName,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {tTools("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
              >
                {tTools("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
