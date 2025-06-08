import { Book, CreateBook, UpdateBook } from "@/types/book";
import { BookFilter, CompactBook } from "@/types/book";
import http from "./http";
import { AxiosResponse } from "axios";
import { Genre } from "@/types/book-list";

export async function getBooks(filter: BookFilter): Promise<CompactBook[]> {
  const response = await http.get<CompactBook[]>("/books", { params: filter });
  return response.data;
}

export async function getBook(id: string): Promise<Book> {
  const response = await http.get<Book>(`/books/${id}`);
  return response.data;
}

export async function createBook(book: CreateBook): Promise<Book> {
  const response = await http.post<Book, AxiosResponse<Book>>(
    "/books",
    book,
  );
  return response.data;
}

export async function updateBook(id: string, book: UpdateBook): Promise<Book> {
  const response = await http.patch<Book, AxiosResponse<Book>>(
    `/books/${id}`,
    book,
  );
  return response.data;
}

export async function deleteBook(id: string): Promise<void> {
  await http.delete(`/books/${id}`);
}

export async function updateBooksFromMoly(
  year: number,
  genre: Genre,
): Promise<void> {
  await http.post("/books/update-from-moly", { year, genre });
}
