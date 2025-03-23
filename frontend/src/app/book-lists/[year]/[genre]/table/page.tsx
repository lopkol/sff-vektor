"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBookListGenre } from "../book-list-genre-provider";

export default function Page() {
  const { genreName } = useBookListGenre();
  const t = useTranslations("BookList.Table");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Table />
          {t("title", { genreName })}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{t("content")}</p>
      </CardContent>
    </Card>
  );
}
