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
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { User, UserForm as UserFormType } from "@/types/user";
import { useMemo } from "react";

interface UserFormProps {
  user?: User;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormType) => void;
}

export function UserForm(
  { user, isSaving, onOpenChange, onSubmit }: UserFormProps,
) {
  const t = useTranslations("Admin.Users");
  const tTools = useTranslations("Tools");

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, { message: t("error.name") }),
        email: z.string().email({ message: t("error.email") }),
        role: z.enum(["admin", "user"]),
        molyUrl: z.string().url({ message: t("error.molyUrl") }).or(
          z.literal("").nullable(),
        ),
      }) satisfies z.ZodSchema<UserFormType>,
    [],
  );

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "user",
      molyUrl: user?.molyUrl ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="email">{t("props.email")}</Label>
              <Input id="email" type="email" {...field} />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </>
          )}
        />
      </div>
      <div className="space-y-2">
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="name">{t("props.name")}</Label>
              <Input id="name" {...field} />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </>
          )}
        />
      </div>
      <div className="space-y-2">
        <Controller
          name="molyUrl"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="molyUrl">{t("props.molyUrl")}</Label>
              <Input id="molyUrl" {...field} value={field.value ?? ""} />
              <FormErrorMessage>{errors.molyUrl?.message}</FormErrorMessage>
            </>
          )}
        />
      </div>
      <div className="space-y-2">
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="role">{t("props.role")}</Label>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("props.role")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                  <SelectItem value="user">{t("roles.user")}</SelectItem>
                </SelectContent>
              </Select>
              <FormErrorMessage>{errors.role?.message}</FormErrorMessage>
            </>
          )}
        />
      </div>
      <div className="flex justify-end space-x-2">
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
    </form>
  );
}
