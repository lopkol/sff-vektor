import { BookListYearProvider } from "./book-list-year-provider";

export default async function YearLayout({
  children,
  params,
}: LayoutProps<"/book-lists/[year]">) {
  const { year } = await params;

  return (
    <BookListYearProvider year={Number(year)}>
      {children}
    </BookListYearProvider>
  );
}
