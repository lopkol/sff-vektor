'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookList, createBookList, deleteBookList, getBookList, updateBookList } from '@/services/book-lists';
import { useTranslations } from 'next-intl';
import { BookListForm } from './book-list-form';
import { useToast } from '@/hooks/use-toast';
import { AxiosError } from 'axios';

interface BookListDialogProps {
  onOpenChange: (open: boolean) => void;
  year?: number;
  genre?: 'sci-fi' | 'fantasy';
}

export function BookListDialog({ onOpenChange, year, genre }: BookListDialogProps) {
  const t = useTranslations('Admin.BookLists');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: bookList, isLoading } = useQuery({
    queryKey: ['book-list', year, genre],
    queryFn: () => getBookList(year!, genre!),
    enabled: !!year && !!genre,
    refetchOnMount: 'always',
  });

  const { mutate: createOrUpdateBooklist, isPending: isSavingPending } = useMutation({
    mutationFn: (formData: BookList) => bookList ? updateBookList(formData) : createBookList(formData),
    onSuccess: (updatedBookList) => {
      queryClient.invalidateQueries({ queryKey: ['book-lists'] });
      queryClient.setQueryData(['book-list', updatedBookList.year, updatedBookList.genre], updatedBookList);
      toast({
        title: bookList ? t('toast.updateSuccess') : t('toast.createSuccess'),
        variant: 'success',
      });
      onOpenChange(false);
    },
    onError: (error: AxiosError<{ code: string }>) => {
      toast({
        title: bookList ? t('toast.updateError') : t('toast.createError'),
        description: t.has('error.' + error.response?.data.code as any)
          ? t('error.' + error.response?.data.code as any)
          : t('error.unknown'),
        variant: 'destructive',
      });
    },
  });

  const { mutate: removeBookList, isPending: isDeletingPending } = useMutation({
    mutationFn: ({ year, genre }: { year: number, genre: 'sci-fi' | 'fantasy' }) => deleteBookList(year, genre),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-lists'] });
      queryClient.removeQueries({ queryKey: ['book-list', year, genre] });
      toast({
        title: t('toast.deleteSuccess'),
        variant: 'success',
      });
      onOpenChange(false);
    },
    onError: (error: AxiosError<{ code: string }>) => {
      toast({
        title: t('toast.deleteError'),
        description: t.has('error.' + error.response?.data.code as any)
          ? t('error.' + error.response?.data.code as any)
          : t('error.unknown'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: BookList) => {
    createOrUpdateBooklist(data);
  };

  const onDelete = () => {
    if (bookList) {
      removeBookList({ year: bookList.year, genre: bookList.genre });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bookList ? t('dialog.editTitle') : t('dialog.createTitle')}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <BookListForm
            bookList={bookList}
            isSaving={isSavingPending}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            onDelete={onDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
