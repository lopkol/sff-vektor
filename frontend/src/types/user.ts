export enum UserRole {
  Admin = "admin",
  User = "user",
}

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  readerId: string | null;
  molyUsername: string | null;
  molyUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateUser = Pick<
  User,
  "email" | "name" | "molyUrl" | "molyUsername" | "role" | "isActive"
>;

export type UpdateUser = Partial<CreateUser>;

export type UserForm = Pick<User, "email" | "name" | "molyUrl" | "role">;
