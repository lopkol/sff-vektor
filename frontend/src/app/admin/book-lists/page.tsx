"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBookLists, syncBookListsFromMoly } from "@/services/book-lists";
import { syncReadingsFromMoly } from "@/services/reading-plans";
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
import { Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function BookListsPage() {
  const t = useTranslations("Admin.BookLists");
  const [selectedBookList, setSelectedBookList] = useState<
    ShortBookList | null
  >(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: bookLists, isLoading } = useQuery({
    queryKey: ["book-lists"],
    queryFn: getBookLists,
  });

  const { mutate: syncBookLists, isPending: isSyncingBookLists } = useMutation({
    mutationFn: syncBookListsFromMoly,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-lists"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success(t("sync.bookListsSuccess"));
    },
    onError: () => {
      toast.error(t("sync.error"));
    },
  });

  const { mutate: syncReadings, isPending: isSyncingReadings } = useMutation({
    mutationFn: syncReadingsFromMoly,
    onSuccess: () => {
      toast.success(t("sync.readingsSuccess"));
    },
    onError: () => {
      toast.error(t("sync.error"));
    },
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
        <CardTitle className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-2xl font-bold">{t("table.title")}</h1>
          {/* The two sync buttons stay inline on large screens, but drop to a
              full-width second line together once they no longer fit. */}
          <div className="order-last flex w-full flex-wrap justify-end gap-2 lg:order-none lg:w-auto">
            <Button
              variant="outline"
              onClick={() => syncBookLists()}
              disabled={isSyncingBookLists}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  isSyncingBookLists ? "animate-spin" : ""
                }`}
              />
              {t("sync.bookLists")}
            </Button>
            <Button
              variant="outline"
              onClick={() => syncReadings()}
              disabled={isSyncingReadings}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  isSyncingReadings ? "animate-spin" : ""
                }`}
              />
              {t("sync.readings")}
            </Button>
          </div>
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
              <TableHead>{t("props.archived")}</TableHead>
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
                <TableCell>
                  {bookList.archivedAt ? <Check className="h-4 w-4" /> : null}
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
