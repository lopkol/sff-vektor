import { BookListYearProvider } from "./book-list-year-provider";

export default async function YearLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;

  return (
    <BookListYearProvider year={Number(year)}>
      {children}
    </BookListYearProvider>
  );
}
