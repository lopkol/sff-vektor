// @ts-types="npm:@types/jsdom"
import { JSDOM } from "jsdom";
import type { CommonQueryMethods } from "slonik";
import {
  getMolyAxiosInstance,
  molyBaseUrl,
  raxConfig,
} from "@/config/moly-axios.ts";
import {
  type BookFromList,
  type BookFromShelf,
  getBooksFromListPage,
  getBooksFromShelfPage,
  getOtherPages,
} from "@/helpers/moly/book-list.ts";
import type { Genre } from "@/schema/book.ts";
import { getOrCreateDatabasePool } from "@/config/database.ts";
import { getBookList, getBookListsByYear } from "@/db/book-list.ts";
import { EntityNotFoundException } from "@/exceptions/entity-not-found.exception.ts";
import { createOrUpdateBookFromMoly } from "@/services/moly/book.ts";
import { logger } from "@sffvektor/lib";

async function getBooksFromList(url: string): Promise<BookFromList[]> {
  try {
    const axios = getMolyAxiosInstance();
    const res = await axios.get(url, { raxConfig });
    const { document } = new JSDOM(res.data).window;

    const otherPages = getOtherPages(document);
    const books = getBooksFromListPage(document);

    const otherPagesBooks = await Promise.all(
      otherPages.map(async (pageUrl) => {
        const response = await axios.get(molyBaseUrl + pageUrl, { raxConfig });
        const { document: doc } = new JSDOM(response.data).window;

        return getBooksFromListPage(doc);
      }),
    );

    return books.concat(...otherPagesBooks);
  } catch (error) {
    logger.error("Failed to get books from Moly list", { url, error });
    throw new Error(`failed to get books from list ${url}`);
  }
}

async function getBooksFromPendingShelf(url: string): Promise<BookFromShelf[]> {
  try {
    const axios = getMolyAxiosInstance();
    const res = await axios.get(url, { raxConfig });
    const { document } = new JSDOM(res.data).window;

    const otherPages = getOtherPages(document);
    const books = getBooksFromShelfPage(document);

    const otherPagesBooks = await Promise.all(
      otherPages.map(async (pageUrl) => {
        const response = await axios.get(pageUrl, { raxConfig });
        const { document: doc } = new JSDOM(response.data).window;

        return getBooksFromShelfPage(doc);
      }),
    );

    return books.concat(...otherPagesBooks);
  } catch (error) {
    logger.error("Failed to get books from Moly shelf", { url, error });
    throw new Error(`failed to get books from shelf ${url}`);
  }
}

async function createOrUpdateBooksOfListFromMoly(
  db: CommonQueryMethods,
  year: number,
  genre: Genre,
): Promise<void> {
  const bookList = await getBookList(db, year, genre);
  if (!bookList) {
    throw new EntityNotFoundException("Booklist does not exist", {
      year,
      genre,
    });
  }

  const { url, pendingUrl } = bookList;

  const booksFromList = await getBooksFromList(url);
  await Promise.all(booksFromList.map(async (book) => {
    await createOrUpdateBookFromMoly(
      molyBaseUrl + book.relativeUrl,
      year,
      genre,
      book.id,
      false,
    );
  }));

  if (pendingUrl) {
    const pendingBooks = await getBooksFromPendingShelf(pendingUrl);
    await Promise.all(pendingBooks.map(async (book) => {
      if (book.note && book.note.toLowerCase().includes(genre)) {
        await createOrUpdateBookFromMoly(
          molyBaseUrl + book.relativeUrl,
          year,
          genre,
          book.id,
          true,
        );
      }
    }));
  }

  logger.info("Books updated for list", { year, genre });
}

export async function createOrUpdateBooksFromMoly(
  year: number,
  genre?: Genre,
): Promise<void> {
  const db = await getOrCreateDatabasePool();
  if (genre) {
    await createOrUpdateBooksOfListFromMoly(db, year, genre);
    return;
  }

  const bookLists = await getBookListsByYear(db, year);
  if (!bookLists.length) {
    throw new EntityNotFoundException("No book lists exist for year", { year });
  }

  for (const bookList of bookLists) {
    await createOrUpdateBooksOfListFromMoly(db, year, bookList.genre);
  }

  logger.info("Books updated for year", { year });
}
