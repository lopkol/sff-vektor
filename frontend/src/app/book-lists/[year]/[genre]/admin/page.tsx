"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBooks, updateBooksFromMoly } from "@/services/books";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSkeleton } from "@/components/page-skeleton";
import { useBookListGenre } from "@/app/book-lists/[year]/[genre]/book-list-genre-provider";
import { useMemo, useState } from "react";
import { useBookListYear } from "@/app/book-lists/[year]/book-list-year-provider";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { BookDialog } from "@/components/books/book-dialog";
import { CompactBook } from "@/types/book";
import { MolyLink } from "@/components/moly-link";

export default function AdminPage() {
  const t = useTranslations("BookList.Admin");
  const { year } = useBookListYear();
  const { genre, genreName } = useBookListGenre();
  const queryClient = useQueryClient();
  const [selectedBook, setSelectedBook] = useState<CompactBook | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: books, isLoading } = useQuery({
    queryKey: ["books", year, genre],
    queryFn: () => getBooks({ year, genre }),
  });

  const { mutate: syncBooks, isPending: isSyncing } = useMutation({
    mutationFn: () => updateBooksFromMoly(year, genre),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", year, genre] });
      toast.success(t("syncSuccess"));
    },
    onError: () => {
      toast.error(t("syncError"));
    },
  });

  const hasNotApproved = useMemo(
    () => books?.some((b) => !b.isApproved),
    [books],
  );

  if (isLoading) {
    return <PageSkeleton />;
  }

  const handleRowClick = (book: CompactBook) => {
    setSelectedBook(book);
    setIsDialogOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedBook(null);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["books", year, genre] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {t("title", { year, genreName })}
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => syncBooks()}
              disabled={isSyncing}
              className="min-w-10"
            >
              <RefreshCw
                className={`h-4 w-4 md:mr-2 ${isSyncing ? "animate-spin" : ""}`}
              />
              <span className="hidden md:block">{t("syncFromMoly")}</span>
            </Button>
            <Button onClick={handleCreateClick}>{t("addBook")}</Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {books?.map((book) => {
              return (
                <TableRow
                  key={book.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(book)}
                >
                  {hasNotApproved && (
                    <TableCell className="w-6">
                      {!book.isApproved && <span>⚠️</span>}
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      {book.authorNames.join(", ")} - {book.title}
                      {book.urls?.[0] && <MolyLink url={book.urls[0]} />}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      {isDialogOpen && (
        <BookDialog
          onOpenChange={setIsDialogOpen}
          bookId={selectedBook?.id}
          defaultYear={year}
          defaultGenre={genre}
          onSuccess={handleFormSuccess}
        />
      )}
    </Card>
  );
}
