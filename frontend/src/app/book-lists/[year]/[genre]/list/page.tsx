"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { getBooksWithReadingPlan } from "@/services/books";
import { setReadingPlan } from "@/services/reading-plans";
import { getBookLists } from "@/services/book-lists";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSkeleton } from "@/components/page-skeleton";
import { useBookListGenre } from "../book-list-genre-provider";
import { useBookListYear } from "@/app/book-lists/[year]/book-list-year-provider";
import { toast } from "sonner";
import { MolyLink } from "@/components/moly-link";
import { LockIcon } from "lucide-react";
import { BookWithReadingPlan } from "@/types/book";
import { ReadingPlanStatus } from "@/types/reading-plan";

// Statuses a reader can set by hand. `molyRead` is intentionally excluded: it is
// synced from Moly and locked, so it never appears as a selectable option.
const READING_PLAN_STATUSES: ReadingPlanStatus[] = [
  "noPlan",
  "willRead",
  "read",
  "willNotRead",
];

const READING_PLAN_EMOJI: Record<ReadingPlanStatus, string> = {
  noPlan: "🤔",
  willRead: "🔖",
  read: "✅",
  molyRead: "✅",
  willNotRead: "🚫",
};

export default function Page() {
  const t = useTranslations("BookList.List");
  const { year } = useBookListYear();
  const { genre, genreName } = useBookListGenre();
  const queryClient = useQueryClient();
  const queryKey = ["reading-plans", year, genre];

  const { data: books, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getBooksWithReadingPlan(year, genre),
    retry: false,
  });

  // Archived lists are frozen: reading plans become read-only.
  const { data: bookLists } = useQuery({
    queryKey: ["book-lists"],
    queryFn: getBookLists,
  });
  const isArchived = !!bookLists?.find(
    (bookList) => bookList.year === year && bookList.genre === genre,
  )?.archivedAt;

  const { mutate: updateReadingPlan } = useMutation({
    mutationFn: (
      { bookId, status }: { bookId: string; status: ReadingPlanStatus },
    ) => setReadingPlan(bookId, status),
    onMutate: async ({ bookId, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BookWithReadingPlan[]>(queryKey);
      queryClient.setQueryData<BookWithReadingPlan[]>(
        queryKey,
        (old) =>
          old?.map((book) =>
            book.id === bookId ? { ...book, readingPlanStatus: status } : book
          ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(t("updateError"));
    },
  });

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    const isNotJuryMember = isAxiosError(error) &&
      (error.response?.data as { code?: string } | undefined)?.code ===
        "NOT_A_JURY_MEMBER";
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title", { genreName })}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {isNotJuryMember ? t("notJuryMember") : t("loadError")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            {t("title", { genreName })}
            {isArchived && (
              <span className="rounded bg-muted px-2 py-0.5 text-sm font-normal text-muted-foreground">
                {t("archived")}
              </span>
            )}
          </h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.title")}</TableHead>
              <TableHead className="w-56">{t("columns.readingPlan")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books?.map((book) => (
              <TableRow key={book.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    {book.authorNames.join(", ")} - {book.title}
                    {book.urls?.[0] && <MolyLink url={book.urls[0]} />}
                  </span>
                </TableCell>
                <TableCell>
                  {book.readingPlanStatus === "molyRead"
                    ? (
                      <span className="inline-flex items-center gap-1.5 px-3 text-muted-foreground">
                        {READING_PLAN_EMOJI.molyRead} {t("statuses.molyRead")}
                        <LockIcon className="size-3.5" />
                      </span>
                    )
                    : (
                      <Select
                        value={book.readingPlanStatus ?? "noPlan"}
                        disabled={isArchived}
                        onValueChange={(value) =>
                          updateReadingPlan({
                            bookId: book.id,
                            status: value as ReadingPlanStatus,
                          })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {READING_PLAN_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {READING_PLAN_EMOJI[status]}{" "}
                              {t(`statuses.${status}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                </TableCell>
              </TableRow>
            ))}
            {books?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-muted-foreground"
                >
                  {t("noBooks")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
