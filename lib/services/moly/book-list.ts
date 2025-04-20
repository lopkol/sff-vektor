// @ts-types="npm:@types/jsdom"
import { JSDOM } from "jsdom";
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
import { getBookList } from "@/db/book-list.ts";
import { EntityNotFoundException } from "@/exceptions/entity-not-found.exception.ts";
import { createOrUpdateBookFromMoly } from "@/services/moly/book.ts";

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
    // TODO: logging
    console.error(error);
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
    // TODO: logging
    console.error(error);
    throw new Error(`failed to get books from shelf ${url}`);
  }
}

export async function createOrUpdateBooksOfListFromMoly(
  year: number,
  genre: Genre,
): Promise<void> {
  const connection = await getOrCreateDatabasePool();
  const bookList = await getBookList(connection, year, genre);
  if (!bookList) {
    throw new EntityNotFoundException("Booklist does not exist", {
      year,
      genre,
    });
  }

  const { url, pendingUrl } = bookList;

  const booksFromList = await getBooksFromList(url);
  booksFromList.forEach(async (book) => {
    await createOrUpdateBookFromMoly(
      molyBaseUrl + book.relativeUrl,
      year,
      genre,
      book.id,
      false,
    );
  });

  if (pendingUrl) {
    const pendingBooks = await getBooksFromPendingShelf(pendingUrl);
    pendingBooks.forEach(async (book) => {
      if (book.note && book.note.includes(genre)) {
        await createOrUpdateBookFromMoly(
          molyBaseUrl + book.relativeUrl,
          year,
          genre,
          book.id,
          true,
        );
      }
    });
  }

  // TODO: logging
  console.log("Books updated for list", { year, genre });
}
