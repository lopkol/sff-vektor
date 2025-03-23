"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useBookListYear } from "../book-list-year-provider";

export default function Page() {
  const t = useTranslations("BookList.Books");
  const { year } = useBookListYear();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title", { year })}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{t("content")}</p>
      </CardContent>
    </Card>
  );
}
