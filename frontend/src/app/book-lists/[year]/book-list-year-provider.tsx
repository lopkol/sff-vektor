"use client";

import type React from "react";
import { createContext, useContext } from "react";

type BookListYearContextType = {
  year: number;
};

const BookListYearContext = createContext<BookListYearContextType | undefined>(
  undefined,
);

export const useBookListYear = () => {
  const context = useContext(BookListYearContext);
  if (!context) {
    throw new Error(
      "useBookListYear must be used within a BookListYearProvider",
    );
  }
  return context;
};

export function BookListYearProvider({
  children,
  year,
}: {
  children: React.ReactNode;
  year: number;
}) {
  return (
    <BookListYearContext.Provider value={{ year }}>
      {children}
    </BookListYearContext.Provider>
  );
}
