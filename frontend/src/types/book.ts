import { Genre } from "./book-list";
import { ReadingPlanStatus } from "./reading-plan";

export type BookAlternative = {
  name: string;
  urls: string[];
};

export type Book = {
  id: string;
  title: string;
  year: number;
  genre?: Genre | null;
  series?: string | null;
  seriesNumber?: string | null;
  isApproved: boolean;
  isPending: boolean;
  createdAt: string;
  updatedAt: string;
  alternatives: BookAlternative[];
  authors: string[];
};

export type BookFilter = Pick<Book, "year" | "genre">;

export type CompactBook =
  & Pick<
    Book,
    | "id"
    | "title"
    | "year"
    | "genre"
    | "series"
    | "seriesNumber"
    | "isApproved"
    | "isPending"
  >
  & {
    urls: string[];
    authorNames: string[];
    authorSortNames: string[];
  };

export type BookWithReadingPlan = CompactBook & {
  readingPlanStatus: ReadingPlanStatus | null;
};

export type CreateBook = Omit<Book, "id" | "createdAt" | "updatedAt">;

export type UpdateBook = Partial<CreateBook>;
