"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthors } from "@/services/authors";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSkeleton } from "@/components/page-skeleton";
import { AuthorDialog } from "@/components/authors/author-dialog";
import { Author } from "@/types/author";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { MolyLink } from "@/components/moly-link";

export default function AuthorsPage() {
  const t = useTranslations("Authors");
  const tTools = useTranslations("Tools");
  const queryClient = useQueryClient();
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: authors, isLoading } = useQuery({
    queryKey: ["authors"],
    queryFn: () => getAuthors(),
  });

  const hasNotApproved = useMemo(
    () => authors?.some((author) => !author.isApproved),
    [authors],
  );

  const filteredAuthors = useMemo(() => {
    if (!authors) return [];
    if (!searchQuery.trim()) return authors;

    const query = searchQuery.toLowerCase().trim();
    return authors.filter(
      (author) =>
        author.displayName.toLowerCase().includes(query) ||
        author.sortName.toLowerCase().includes(query),
    );
  }, [authors, searchQuery]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  const handleRowClick = (author: Author) => {
    setSelectedAuthorId(author.id);
    setIsDialogOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedAuthorId(null);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["authors"] });
  };

  const searchBox = (className?: string) => (
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
        <CardTitle className="flex justify-between items-center gap-2">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <div className="flex items-center gap-2">
            {searchBox("hidden md:block w-64")}
            <Button onClick={handleCreateClick}>{t("addNew")}</Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {searchBox("w-full md:hidden")}

        <Table>
          <TableHeader>
            <TableRow>
              {hasNotApproved && <TableHead className="w-6" />}
              <TableHead>{t("props.name")}</TableHead>
              <TableHead>{t("props.sortName")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAuthors.map((author) => (
              <TableRow
                key={author.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(author)}
              >
                {hasNotApproved && (
                  <TableCell className="w-6">
                    {!author.isApproved && <span>⚠️</span>}
                  </TableCell>
                )}
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    {author.displayName}
                    {author.url && <MolyLink url={author.url} />}
                  </span>
                </TableCell>
                <TableCell>{author.sortName}</TableCell>
              </TableRow>
            ))}
            {filteredAuthors.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={hasNotApproved ? 3 : 2}
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
        <AuthorDialog
          onOpenChange={setIsDialogOpen}
          onSuccess={handleFormSuccess}
          authorId={selectedAuthorId ?? undefined}
        />
      )}
    </Card>
  );
}
