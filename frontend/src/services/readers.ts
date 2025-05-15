import http from "./http";
import { Reader } from "@/types/reader";

export async function getReaders(): Promise<Reader[]> {
  const response = await http.get<Reader[]>("/readers");
  return response.data;
}
