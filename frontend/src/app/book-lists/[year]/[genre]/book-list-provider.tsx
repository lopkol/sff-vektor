"use client";

import { capitalize } from "@/lib/utils";
import React, { createContext, useContext } from "react";

type BookListContextType = {
  year: string;
  genre: string;
  genreName: string;
};

const BookListContext = createContext<BookListContextType | undefined>(
  undefined
);

export const useBookList = () => {
  const context = useContext(BookListContext);
  if (!context) {
    throw new Error("useBookList must be used within a BookListProvider");
  }
  return context;
};

export function BookListProvider({
  children,
  year,
  genre,
}: {
  children: React.ReactNode;
  year: string;
  genre: string;
}) {
  const genreName = capitalize(genre);

  return (
    <BookListContext.Provider value={{ year, genre, genreName }}>
      {children}
    </BookListContext.Provider>
  );
}
