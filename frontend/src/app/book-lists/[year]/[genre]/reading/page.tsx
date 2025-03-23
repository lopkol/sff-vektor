"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBookListGenre } from "../book-list-genre-provider";

export default function Page() {
  const { genreName } = useBookListGenre();
  const t = useTranslations("BookList.Reading");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen />
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
