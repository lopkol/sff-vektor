import { z } from "zod";

export enum Genre {
  Fantasy = "fantasy",
  SciFi = "sci-fi",
}

export const bookAlternativeSchema = z.object({
  name: z.string(),
  urls: z.array(z.string()),
});

export type BookAlternative = z.infer<typeof bookAlternativeSchema>;

// TODO: add author ids
export const bookSchema = z.object({
  id: z.string(),
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
});

export type Book = z.infer<typeof bookSchema>;

export const createBookSchema = bookSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateBook = z.infer<typeof createBookSchema>;

export const updateBookSchema = createBookSchema.partial();

export type UpdateBook = z.infer<typeof updateBookSchema>;
