"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBooks, updateBooksFromMoly } from "@/services/books";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSkeleton } from "@/components/page-skeleton";
import { useMemo, useState } from "react";
import { useBookListYear } from "@/app/book-lists/[year]/book-list-year-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, ChevronsUpDown, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { BookDialog } from "@/components/books/book-dialog";
import { CompactBook } from "@/types/book";
import { Genre } from "@/types/book-list";
import { MolyLink } from "@/components/moly-link";
import { cn } from "@/lib/utils";

type SortColumn = "genre" | "title";
type SortDirection = "asc" | "desc";

const genreRank = (genre?: Genre | null) => {
  if (genre === "fantasy") return 0;
  if (genre === "sci-fi") return 1;
  return 2;
};

export default function Page() {
  const t = useTranslations("BookList.Books");
  const tTools = useTranslations("Tools");
  const { year } = useBookListYear();
  const queryClient = useQueryClient();
  const [selectedBook, setSelectedBook] = useState<CompactBook | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("genre");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { data: books, isLoading } = useQuery({
    queryKey: ["books", year],
    queryFn: () => getBooks({ year }),
  });

  const { mutate: syncBooks, isPending: isSyncing } = useMutation({
    mutationFn: () => updateBooksFromMoly(year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", year] });
      toast.success(t("syncSuccess"));
    },
    onError: () => {
      toast.error(t("syncError"));
    },
  });

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    const query = searchQuery.toLowerCase().trim();
    if (!query) return books;
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.authorNames.some((name) => name.toLowerCase().includes(query)),
    );
  }, [books, searchQuery]);

  // Books arrive already ordered by (genre, authorSortNames, title), so the
  // within-genre order can be preserved via the original index.
  const sortedBooks = useMemo(() => {
    const byAuthorThenTitle = (a: CompactBook, b: CompactBook) =>
      a.authorSortNames.join(" ").localeCompare(b.authorSortNames.join(" ")) ||
      a.title.localeCompare(b.title);

    return filteredBooks
      .map((book, index) => ({ book, index }))
      .sort((a, b) => {
        const cmp = sortColumn === "genre"
          ? genreRank(a.book.genre) - genreRank(b.book.genre) ||
            a.index - b.index
          : byAuthorThenTitle(a.book, b.book);
        return sortDirection === "asc" ? cmp : -cmp;
      })
      .map(({ book }) => book);
  }, [filteredBooks, sortColumn, sortDirection]);

  const genreLabel = (genre?: Genre | null) => {
    if (genre === "sci-fi") return tTools("genres.sciFi");
    if (genre === "fantasy") return tTools("genres.fantasy");
    return "";
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderSortableHeader = (column: SortColumn, label: string) => (
    <TableHead>
      <button
        type="button"
        onClick={() => handleSort(column)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {sortColumn === column
          ? (
            sortDirection === "asc"
              ? <ArrowUp className="h-3.5 w-3.5" />
              : <ArrowDown className="h-3.5 w-3.5" />
          )
          : <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />}
      </button>
    </TableHead>
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
    queryClient.invalidateQueries({ queryKey: ["books", year] });
  };

  const renderSearch = (className: string) => (
    <div className={cn("relative", className)}>
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={tTools("search")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-8"
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">{t("title", { year })}</h1>
          <div className="flex items-center gap-2">
            {renderSearch("hidden w-56 lg:block")}
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
        {renderSearch("mb-4 w-full lg:hidden")}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-6"></TableHead>
              {renderSortableHeader("title", t("props.title"))}
              {renderSortableHeader("genre", t("props.genre"))}
              <TableHead>{t("props.pending")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedBooks.map((book) => (
              <TableRow
                key={book.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(book)}
              >
                <TableCell className="w-6">
                  {!book.isApproved && <span>⚠️</span>}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    {book.authorNames.join(", ")} - {book.title}
                    {book.urls?.[0] && <MolyLink url={book.urls[0]} />}
                  </span>
                </TableCell>
                <TableCell>{genreLabel(book.genre)}</TableCell>
                <TableCell>
                  {book.isPending && (
                    <Badge variant="secondary">{t("props.pending")}</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {sortedBooks.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  {tTools("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {isDialogOpen && (
        <BookDialog
          onOpenChange={setIsDialogOpen}
          bookId={selectedBook?.id}
          defaultYear={year}
          defaultGenre={null}
          onSuccess={handleFormSuccess}
        />
      )}
    </Card>
  );
}
