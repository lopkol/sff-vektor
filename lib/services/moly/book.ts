// @ts-types="npm:@types/jsdom"
import { JSDOM } from "jsdom";
import axios from "axios";
import * as rax from "retry-axios";
import { molyBaseUrl, raxConfig } from "@/services//moly/constants.ts";
import {
  getAuthorsFromBookPage,
  getOriginalVersionUrlFromBookPage,
  getTitleAndSeriesFromBookPage,
} from "@/helpers/moly/book.ts";
import { createAuthor, getAuthorByName } from "@/db/author.ts";
import type { DatabasePoolConnection } from "slonik";
import type { CreateBook, Genre } from "@/schema/book.ts";
import { guessAuthorSortName } from "@/helpers/author.ts";
import { getOrCreateDatabasePool } from "@/config/database.ts";
import {
  createBook,
  getBookByMolyId,
  getBookByUrl,
  updateBook,
} from "@/db/book.ts";

rax.attach();

async function getOrCreateAuthor(
  connection: DatabasePoolConnection,
  name: string,
  relativeUrl: string,
): Promise<string> {
  const existingAuthor = await getAuthorByName(connection, name);
  if (existingAuthor) {
    return existingAuthor.id;
  }

  const author = await createAuthor(connection, {
    displayName: name,
    sortName: guessAuthorSortName(name),
    url: molyBaseUrl + relativeUrl,
    isApproved: false,
  });
  return author.id;
}

async function createOrUpdateBook(
  connection: DatabasePoolConnection,
  url: string,
  props: CreateBook,
): Promise<void> {
  const existingBook = props.molyId
    ? await getBookByMolyId(connection, props.molyId)
    : await getBookByUrl(connection, url);

  if (existingBook && existingBook.isApproved) {
    // if approved: the only thing we can update is the pending status
    if (existingBook.isPending && !props.isPending) {
      await updateBook(connection, existingBook.id, {
        isPending: false,
      });
    }
    return;
  }
  if (existingBook) {
    await updateBook(connection, existingBook.id, props);
    return;
  }

  await createBook(connection, props);
}

export async function createOrUpdateBookFromMoly(
  url: string,
  year: number,
  genre: Genre | null,
  molyId: string | null = null,
  isPending = false,
): Promise<void> {
  try {
    // fetch book page from moly
    const res = await axios.get(url, { raxConfig });
    const { document } = new JSDOM(res.data).window;

    // get details from the page
    const authors = getAuthorsFromBookPage(document);
    const { title, series, seriesNum } = getTitleAndSeriesFromBookPage(
      document,
    );
    const originalVersionUrl = getOriginalVersionUrlFromBookPage(document);
    const hunVersion = { name: "magyar", urls: [url] };
    const alternatives = originalVersionUrl
      ? [hunVersion, {
        name: "eredeti",
        urls: [molyBaseUrl + originalVersionUrl],
      }]
      : [hunVersion];

    // create or update book in the database
    const connection = await getOrCreateDatabasePool();
    const authorIds = await Promise.all(
      authors.map(async (author) => {
        const authorId = await getOrCreateAuthor(
          connection,
          author.name,
          author.relativeUrl,
        );
        return authorId;
      }),
    );

    await createOrUpdateBook(connection, url, {
      molyId,
      title,
      year,
      genre,
      series,
      seriesNumber: seriesNum,
      isApproved: false,
      isPending,
      alternatives,
      authors: authorIds,
    });
  } catch (error) {
    // TODO: logging
    console.error(error);
    throw new Error(`Failed to get book details from ${url}`);
  }
}
