import { z } from "zod";
import { isUuidv7 } from "@/helpers/type.ts";

export enum Genre {
  Fantasy = "fantasy",
  SciFi = "sci-fi",
}

export const bookAlternativeSchema = z.object({
  name: z.string(),
  urls: z.array(z.string()),
});

export type BookAlternative = z.infer<typeof bookAlternativeSchema>;

export const bookSchema = z.object({
  id: z.string().refine((id: string) => isUuidv7(id), {
    message: "Invalid book id",
  }),
  molyId: z.string().nullable().optional(),
  title: z.string(),
  year: z.number(),
  genre: z.nativeEnum(Genre).nullable().optional(),
  series: z.string().nullable().optional(),
  seriesNumber: z.string().nullable().optional(),
  isApproved: z.boolean(),
  isPending: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  alternatives: z.array(bookAlternativeSchema),
  authors: z.array(
    z.string().refine((id: string) => isUuidv7(id), {
      message: "Invalid author id",
    }),
  ),
});

export type Book = z.infer<typeof bookSchema>;

export const bookFilterSchema = bookSchema.pick({
  year: true,
  genre: true,
});

export type BookFilter = z.infer<typeof bookFilterSchema>;

export const createBookSchema = bookSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateBook = z.infer<typeof createBookSchema>;

export const updateBookSchema = createBookSchema.omit({
  molyId: true,
}).partial();

export type UpdateBook = z.infer<typeof updateBookSchema>;

export const compactBookSchema = bookSchema.pick({
  id: true,
  title: true,
  year: true,
  genre: true,
  series: true,
  seriesNumber: true,
  isApproved: true,
  isPending: true,
}).extend({
  urls: z.array(z.string()).nullable().optional(),
  authorNames: z.array(z.string()),
  authorSortNames: z.array(z.string()),
});

export type CompactBook = z.infer<typeof compactBookSchema>;
