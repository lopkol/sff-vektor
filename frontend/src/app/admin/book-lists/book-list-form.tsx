'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookList } from '@/services/book-lists';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState } from 'react';

const schema = z.object({
  year: z.number(),
  genre: z.enum(['sci-fi', 'fantasy']),
  url: z.string().url(),
  pendingUrl: z.string().nullable(),
  readers: z.array(z.string()),
}) satisfies z.ZodSchema<BookList>;

interface BookListFormProps {
  bookList?: BookList;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BookList) => void;
  onDelete: () => void;
}

export function BookListForm({ bookList, isSaving, onOpenChange, onSubmit, onDelete }: BookListFormProps) {
  const t = useTranslations('Admin.BookLists');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      year: bookList?.year ?? new Date().getFullYear(),
      genre: bookList?.genre ?? 'sci-fi',
      url: bookList?.url ?? '',
      pendingUrl: bookList?.pendingUrl ?? '',
      readers: bookList?.readers ?? [],
    },
  });

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    onDelete();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Controller
            name="year"
            control={control}
            render={({ field }) => (
              <>
                <Label htmlFor="year">{t('year')}</Label>
                <Input
                  id="year"
                  {...field}
                  type="number"
                  disabled={!!bookList}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                />
                <p className="text-red-500">{errors.year?.message}</p>
            </>
          )}
        />
      </div>
      <div className="space-y-2">
        <Controller
          name="genre"
          control={control}
          render={({ field }) => (
            <>
              <Label htmlFor="genre">{t('genre')}</Label>
              <Select
                {...field}
                disabled={!!bookList}
                onValueChange={(value) => field.onChange(value as 'sci-fi' | 'fantasy')}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('genre')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-red-500">{errors.genre?.message}</p>
            </>
          )}
        />
      </div>
      <div className="space-y-2">
        <Controller
            name="url"
            control={control}
            render={({ field }) => (
              <>
                <Label htmlFor="url">{t('url')}</Label>
                <Input
                  id="url"
                  {...field}
                />
                <p className="text-red-500">{errors.url?.message}</p>
            </>
          )}
        />
      </div>
      <div className="space-y-2">
        <Controller
            name="pendingUrl"
            control={control}
            render={({ field }) => (
              <>
                <Label htmlFor="pendingUrl">{t('pendingUrl')}</Label>
                <Input
                  id="pendingUrl"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(pendingUrl) => field.onChange(pendingUrl || null)}
                />
                <p className="text-red-500">{errors.pendingUrl?.message}</p>
            </>
          )}
        />
      </div>
      <div className="flex justify-between space-x-2">
        <div>
          {bookList && (
            <>
              <Button type="button" variant="destructive" disabled={isSaving} onClick={() => setIsDeleteDialogOpen(true)}>
                {t('delete')}
              </Button>
              {isDeleteDialogOpen && (
                <AlertDialog open={true} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" disabled={isSaving}>
                      {t('delete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('deleteConfirmMessage')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        {t('delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? t('saving') : t('save')}
          </Button>
        </div>
      </div>
    </form>
  );
}
