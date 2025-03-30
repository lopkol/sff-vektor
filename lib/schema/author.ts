import { z } from "zod";

export const authorSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  sortName: z.string(),
  url: z.string().nullable().optional(),
  isApproved: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Author = z.infer<typeof authorSchema>;

export const createAuthorSchema = authorSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateAuthor = z.infer<typeof createAuthorSchema>;

export const updateAuthorSchema = createAuthorSchema.partial();

export type UpdateAuthor = z.infer<typeof updateAuthorSchema>;
