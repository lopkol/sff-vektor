import z from "zod";

export const readerSchema = z.object({
  id: z.string(),
  molyUsername: z.string().nullable().optional(),
  molyUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Reader = z.infer<typeof readerSchema>;

export const createReaderSchema = readerSchema.pick({
  molyUsername: true,
  molyUrl: true,
});

export type CreateReader = z.infer<typeof createReaderSchema>;
