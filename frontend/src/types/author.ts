export type Author = {
  id: string;
  name: string;
  sortName: string;
  url?: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAuthor = Omit<Author, "id" | "createdAt" | "updatedAt">;

export type UpdateAuthor = Partial<CreateAuthor>;
