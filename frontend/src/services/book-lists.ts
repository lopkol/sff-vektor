import { AxiosResponse } from "axios";
import http from "./http";
import {
  BookList,
  BookListGenre,
  CreateBookList,
  ShortBookList,
} from "@/types/book-list";

/**
 * @return non-paginated book lists (sorted by year and genre, both in descending order)
 */
export async function getBookLists(): Promise<ShortBookList[]> {
  const response = await http.get<ShortBookList[]>("/book-lists");
  return response.data;
}

export async function getBookList(
  year: number,
  genre: BookListGenre,
): Promise<BookList> {
  const response = await http.get<BookList>(`/book-lists/${year}/${genre}`);
  return response.data;
}

export async function createBookList(
  bookList: CreateBookList,
): Promise<BookList> {
  const response = await http.post<BookList, AxiosResponse<BookList>>(
    "/book-lists",
    bookList,
  );
  return response.data;
}

export async function updateBookList(
  bookList: CreateBookList,
): Promise<BookList> {
  const response = await http.patch<BookList, AxiosResponse<BookList>>(
    `/book-lists/${bookList.year}/${bookList.genre}`,
    {
      url: bookList.url,
      pendingUrl: bookList.pendingUrl,
      readers: bookList.readers,
    },
  );
  return response.data;
}

export async function deleteBookList(
  year: number,
  genre: BookListGenre,
): Promise<void> {
  await http.delete(`/book-lists/${year}/${genre}`);
}
