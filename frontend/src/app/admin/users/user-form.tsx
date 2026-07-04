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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { User, UserForm as UserFormType, UserRole } from "@/types/user";
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
        role: z.enum([UserRole.Admin, UserRole.User]),
        molyUrl: z.string().url({ message: t("error.molyUrl") }).or(
          z.literal("").nullable(),
        ),
      }) satisfies z.ZodSchema<UserFormType>,
    [],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: user?.role ?? UserRole.User,
      molyUrl: user?.molyUrl ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("props.email")}</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("props.name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="molyUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("props.molyUrl")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("props.role")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("props.role")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UserRole.Admin}>
                    {t("roles.admin")}
                  </SelectItem>
                  <SelectItem value={UserRole.User}>
                    {t("roles.user")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
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
    </Form>
  );
}
