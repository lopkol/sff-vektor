import { Genre } from "@/types/book-list";
import { notFound } from "next/navigation";
import { BookListLayout } from "./book-list-genre-layout";
import { BookListGenreProvider } from "./book-list-genre-provider";

function isGenre(value: string): value is Genre {
  return value === "sci-fi" || value === "fantasy";
}

export default async function GenreLayout({
  children,
  params,
}: LayoutProps<"/book-lists/[year]/[genre]">) {
  const { genre } = await params;
  if (!isGenre(genre)) {
    notFound();
  }

  return (
    <BookListGenreProvider genre={genre}>
      <BookListLayout>{children}</BookListLayout>
    </BookListGenreProvider>
  );
}
