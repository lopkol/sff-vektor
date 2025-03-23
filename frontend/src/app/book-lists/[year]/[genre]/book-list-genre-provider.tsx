"use client";

import { capitalize } from "@/lib/utils";
import type React from "react";
import { createContext, useContext } from "react";

type BookListGenreContextType = {
  genre: string;
  genreName: string;
};

const BookListGenreContext = createContext<
  BookListGenreContextType | undefined
>(undefined);

export const useBookListGenre = () => {
  const context = useContext(BookListGenreContext);
  if (!context) {
    throw new Error(
      "useBookListGenre must be used within a BookListGenreProvider",
    );
  }
  return context;
};

export function BookListGenreProvider({
  children,
  genre,
}: {
  children: React.ReactNode;
  genre: string;
}) {
  const genreName = capitalize(genre);

  return (
    <BookListGenreContext.Provider value={{ genre, genreName }}>
      {children}
    </BookListGenreContext.Provider>
  );
}
