import { Genre } from "@/types/book-list";
import { BookListLayout } from "./book-list-genre-layout";
import { BookListGenreProvider } from "./book-list-genre-provider";

export default async function GenreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ genre: Genre }>;
}) {
  const { genre } = await params;

  return (
    <BookListGenreProvider genre={genre}>
      <BookListLayout>{children}</BookListLayout>
    </BookListGenreProvider>
  );
}
