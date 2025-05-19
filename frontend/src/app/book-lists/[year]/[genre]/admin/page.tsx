"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBooks, updateBooksFromMoly } from "@/services/books";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSkeleton } from "@/components/page-skeleton";
import { useBookListGenre } from "../book-list-genre-provider";
import { useMemo } from "react";
import { useBookListYear } from "../../book-list-year-provider";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const t = useTranslations("BookList.Admin");
  const tTools = useTranslations("Tools");
  const { year } = useBookListYear();
  const { genre, genreName } = useBookListGenre();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {t("title", { year, genreName })}
          </h1>
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncBooks()}
            disabled={isSyncing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
            />
            {t("syncFromMoly")}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {books?.map((book) => {
              return (
                <TableRow key={book.id}>
                  {hasNotApproved && (
                    <TableCell className="w-6">
                      {!book.isApproved && (
                        <span role="img" aria-label="not approved">⚠️</span>
                      )}
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
    </Card>
  );
}
