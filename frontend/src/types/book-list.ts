export type Genre = "sci-fi" | "fantasy";

export type BookList = {
  year: number;
  genre: Genre;
  url: string;
  pendingUrl: string | null;
  readers: string[];
  createdAt: string;
  updatedAt: string;
};

export type ShortBookList = Pick<
  BookList,
  "year" | "genre" | "url" | "pendingUrl"
>;

export type CreateBookList = Omit<BookList, "createdAt" | "updatedAt">;
