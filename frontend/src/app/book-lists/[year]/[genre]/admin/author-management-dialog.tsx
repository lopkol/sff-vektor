"use client";

import { useTranslations } from "next-intl";
import { Author } from "@/types/author";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Plus, Search } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthors } from "@/services/authors";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { AuthorDialog } from "./author-dialog";

interface AuthorManagementDialogProps {
  onOpenChange: (open: boolean) => void;
  authorIdsToDisplay?: string[];
  onAuthorCreated?: (authorId: string) => void;
}

export function AuthorManagementDialog(
  { onOpenChange, authorIdsToDisplay, onAuthorCreated }:
    AuthorManagementDialogProps,
) {
  const t = useTranslations("BookList.Admin");
  const tTools = useTranslations("Tools");
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [authorIdToEdit, setAuthorIdToEdit] = useState<string | null>(null);

  const { data: authors, isLoading } = useQuery({
    queryKey: ["authors"],
    queryFn: () => getAuthors(),
  });

  const authorsToDisplay = useMemo(() => {
    if (!authors) return [];
    if (!authorIdsToDisplay) return authors;
    return authors.filter((author) => authorIdsToDisplay.includes(author.id));
  }, [authors, authorIdsToDisplay]);

  const filteredAuthors = useMemo(() => {
    if (!authorsToDisplay) return [];
    if (!searchQuery.trim()) return authorsToDisplay;

    const query = searchQuery.toLowerCase().trim();
    return authorsToDisplay.filter(
      (author) =>
        author.displayName.toLowerCase().includes(query) ||
        author.sortName.toLowerCase().includes(query),
    );
  }, [authorsToDisplay, searchQuery]);

  const hasNotApproved = useMemo(
    () => filteredAuthors?.some((a) => !a.isApproved),
    [filteredAuthors],
  );

  const handleEdit = (author: Author) => {
    setAuthorIdToEdit(author.id);
    setIsFormDialogOpen(true);
  };

  const handleAdd = () => {
    setAuthorIdToEdit(null);
    setIsFormDialogOpen(true);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["authors"] });
    queryClient.invalidateQueries({ queryKey: ["books"] });
  };

  const handleFormDialogClose = (open: boolean) => {
    if (!open) {
      setAuthorIdToEdit(null);
    }
    setIsFormDialogOpen(open);
  };

  return (
    <ResponsiveDialog open={true} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <div className="flex items-center justify-between">
            <ResponsiveDialogTitle>
              {t("authors.title")}
            </ResponsiveDialogTitle>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              {t("authors.add")}
            </Button>
          </div>
        </ResponsiveDialogHeader>

        {isLoading
          ? (
            <div className="mt-4 space-y-4">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )
          : (
            <div className="mt-4 space-y-4">
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={tTools("search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableBody>
                    {filteredAuthors.map((author) => (
                      <TableRow
                        key={author.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEdit(author)}
                      >
                        {hasNotApproved && (
                          <TableCell className="w-6">
                            {!author.isApproved && <span>⚠️</span>}
                          </TableCell>
                        )}
                        <TableCell>{author.displayName}</TableCell>
                      </TableRow>
                    ))}
                    {filteredAuthors.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={1}
                          className="text-center text-muted-foreground"
                        >
                          {tTools("noResults")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

        {isFormDialogOpen && (
          <AuthorDialog
            onOpenChange={handleFormDialogClose}
            onSuccess={handleFormSuccess}
            authorId={authorIdToEdit ?? undefined}
            onAuthorCreated={onAuthorCreated}
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
