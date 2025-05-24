"use client";

import { useTranslations } from "next-intl";
import { Author } from "@/types/author";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteAuthor, getAuthors } from "@/services/authors";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { AuthorFormDialog } from "./author-form-dialog";

interface AuthorManagementDialogProps {
  onOpenChange: (open: boolean) => void;
}

export function AuthorManagementDialog(
  { onOpenChange }: AuthorManagementDialogProps,
) {
  const t = useTranslations("BookList.Admin");
  const tTools = useTranslations("Tools");
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);

  const { data: authors, isLoading } = useQuery({
    queryKey: ["authors"],
    queryFn: () => getAuthors(),
  });

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

  const handleDelete = async (authorId: string) => {
    try {
      await deleteAuthor(authorId);
      await queryClient.invalidateQueries({ queryKey: ["authors"] });
      await queryClient.invalidateQueries({ queryKey: ["books"] });
      setAuthorToDelete(null);
    } catch (error) {
      console.error("Failed to delete author:", error);
    }
  };

  const handleDeleteClick = (author: Author) => {
    setAuthorToDelete(author);
  };

  const handleEdit = (author: Author) => {
    setEditingAuthor(author);
    setIsFormDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingAuthor(null);
    setIsFormDialogOpen(true);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["authors"] });
    queryClient.invalidateQueries({ queryKey: ["books"] });
  };

  const handleFormDialogClose = (newOpen: boolean) => {
    if (!newOpen) {
      setEditingAuthor(null);
    }
    setIsFormDialogOpen(newOpen);
  };

  const handleDeleteDialogClose = (newOpen: boolean) => {
    if (!newOpen) {
      setAuthorToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <>
      <ResponsiveDialog open={true} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <div className="flex items-center justify-between">
              <ResponsiveDialogTitle>
                {t("props.manageAuthors")}
              </ResponsiveDialogTitle>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                {t("props.addAuthor")}
              </Button>
            </div>
          </ResponsiveDialogHeader>

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
                    <TableRow key={author.id}>
                      <TableCell>{author.displayName}</TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(author)}
                            title={t("props.editAuthor")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(author)}
                            title={tTools("delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAuthors.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center text-muted-foreground"
                      >
                        {searchQuery
                          ? tTools("noResults")
                          : t("props.noAuthors")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {isFormDialogOpen && (
            <AuthorFormDialog
              onOpenChange={handleFormDialogClose}
              author={editingAuthor ?? undefined}
              onSuccess={handleFormSuccess}
            />
          )}

          {authorToDelete && (
            <AlertDialog open={true} onOpenChange={handleDeleteDialogClose}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("dialog.deleteAuthorConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("dialog.deleteAuthorConfirmMessage", {
                      name: authorToDelete.displayName,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {tTools("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      handleDelete(authorToDelete.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {tTools("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
