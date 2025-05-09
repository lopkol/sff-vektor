"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookLists } from "@/services/book-lists";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BookListDialog } from "./book-list-dialog";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShortBookList } from "@/types/book-list";
import { PageSkeleton } from "@/components/page-skeleton";

export default function BookListsPage() {
  const t = useTranslations("Admin.BookLists");
  const [selectedBookList, setSelectedBookList] = useState<
    ShortBookList | null
  >(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: bookLists, isLoading } = useQuery({
    queryKey: ["book-lists"],
    queryFn: getBookLists,
  });

  if (isLoading) {
    return <PageSkeleton />;
  }

  const handleRowClick = (bookList: ShortBookList) => {
    setSelectedBookList(bookList);
    setIsDialogOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedBookList(null);
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <h1 className="text-2xl font-bold">{t("table.title")}</h1>
          <Button onClick={handleCreateClick}>{t("table.addNew")}</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("props.year")}</TableHead>
              <TableHead>{t("props.genre")}</TableHead>
              <TableHead className="hidden sm:table-cell">
                {t("props.url")}
              </TableHead>
              <TableHead className="hidden md:table-cell">
                {t("props.pendingUrl")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookLists?.map((bookList, index) => (
              <TableRow
                key={`${bookList.year}-${bookList.genre}-${index}`}
                className="cursor-pointer"
                onClick={() => handleRowClick(bookList)}
              >
                <TableCell>{bookList.year}</TableCell>
                <TableCell>{bookList.genre}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <a
                    href={bookList.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {bookList.url}
                  </a>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {bookList.pendingUrl && (
                    <a
                      href={bookList.pendingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {bookList.pendingUrl}
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {isDialogOpen && (
        <BookListDialog
          onOpenChange={setIsDialogOpen}
          year={selectedBookList?.year}
          genre={selectedBookList?.genre}
        />
      )}
    </Card>
  );
}
