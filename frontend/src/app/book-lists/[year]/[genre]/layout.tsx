import { BookListLayout } from "./book-list-layout";
import { BookListProvider } from "./book-list-provider";

export default function GenreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { year: string; genre: string };
}) {
  return (
    <BookListProvider year={params.year} genre={params.genre}>
      <BookListLayout>{children}</BookListLayout>
    </BookListProvider>
  );
}
