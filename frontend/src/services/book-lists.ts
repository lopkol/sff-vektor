import http from "./http";

export type BookList = {
  year: number;
  genre: "sci-fi" | "fantasy";
};

/**
 * @return a non-paginated book lists (sorted by year and genre, both in descending order)
 */
export async function getBookLists(): Promise<BookList[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mock: BookList[] = [
        {
          year: 2020,
          genre: "sci-fi",
        },
        {
          year: 2020,
          genre: "fantasy",
        },
        {
          year: 2019,
          genre: "sci-fi",
        },
        {
          year: 2019,
          genre: "fantasy",
        },
        {
          year: 2018,
          genre: "sci-fi",
        },
        {
          year: 2018,
          genre: "fantasy",
        },
      ];
      resolve(mock);
    }, 1000);
  });
  const response = await http.get("/book-lists");
  return response.data;
}
