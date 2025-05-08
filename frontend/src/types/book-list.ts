export type BookListGenre = "sci-fi" | "fantasy";

export type BookList = {
  year: number;
  genre: BookListGenre;
  url: string;
  pendingUrl: string | null;
  readers: string[];
  createdAt: string;
  updatedAt: string;
};

export type ShortBookList = Pick<BookList, "year" | "genre" | "url" | "pendingUrl">;

export type CreateBookList = Omit<BookList, "createdAt" | "updatedAt">;
