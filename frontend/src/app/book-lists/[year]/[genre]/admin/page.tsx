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
import { useToast } from "@/hooks/use-toast";
import { BookDialog } from "./book-dialog";
import { CompactBook } from "@/types/book";

export default function AdminPage() {
  const t = useTranslations("BookList.Admin");
  const { year } = useBookListYear();
  const { genre, genreName } = useBookListGenre();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({
        title: t("syncSuccess"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("syncError"),
        variant: "destructive",
      });
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
                    {book.authorNames.join(", ")} - {book.title}
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
          onSuccess={handleFormSuccess}
        />
      )}
    </Card>
  );
}
