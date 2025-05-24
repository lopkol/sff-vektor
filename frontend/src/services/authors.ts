import { Author, CreateAuthor, UpdateAuthor } from "@/types/author";
import http from "./http";
import { AxiosResponse } from "axios";

export async function getAuthors(): Promise<Author[]> {
  const response = await http.get<Author[]>("/authors");
  return response.data;
}

export async function getAuthor(id: string): Promise<Author> {
  const response = await http.get<Author>(`/authors/${id}`);
  return response.data;
}

export async function createAuthor(author: CreateAuthor): Promise<Author> {
  const response = await http.post<Author, AxiosResponse<Author>>(
    "/authors",
    author,
  );
  return response.data;
}

export async function updateAuthor(
  id: string,
  author: UpdateAuthor,
): Promise<Author> {
  const response = await http.patch<Author, AxiosResponse<Author>>(
    `/authors/${id}`,
    author,
  );
  return response.data;
}

export async function deleteAuthor(id: string): Promise<void> {
  await http.delete(`/authors/${id}`);
}
