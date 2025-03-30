import { z } from "zod";
import { Genre } from "@/schema/book.ts";
import { isUuidv7 } from "@/helpers/type.ts";

export const bookListSchema = z.object({
  id: z.string().refine((id: string) => isUuidv7(id), {
    message: "Invalid book list id",
  }),
  year: z.number(),
  genre: z.nativeEnum(Genre),
  url: z.string(),
  pendingUrl: z.string().nullable().optional(),
  readers: z.array(
    z.string().refine((readerId: string) => isUuidv7(readerId), {
      message: "Invalid reader id",
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BookList = z.infer<typeof bookListSchema>;

export const shortBookListSchema = bookListSchema.pick({
  year: true,
  genre: true,
});

export type ShortBookList = z.infer<typeof shortBookListSchema>;

export const createBookListSchema = bookListSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateBookList = z.infer<typeof createBookListSchema>;

export const updateBookListSchema = createBookListSchema.omit({
  year: true,
  genre: true,
});

export type UpdateBookList = z.infer<typeof updateBookListSchema>;
