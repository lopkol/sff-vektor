import z from "zod";

export enum UserRole {
  Admin = "admin",
  User = "user",
}

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean(),
  readerId: z.string().nullable().optional(),
  molyUsername: z.string().nullable().optional(),
  molyUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const createUserSchema = userSchema.pick({
  email: true,
  name: true,
  role: true,
  isActive: true,
  molyUsername: true,
  molyUrl: true,
});

export type CreateUser = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial();

export type UpdateUser = z.infer<typeof updateUserSchema>;
