import z from "zod";
import { createSqlTag, type DatabasePoolConnection, QueryResult } from "slonik";
import { InvalidArgumentException } from "@/exceptions/invalid-argument.exception.ts";
import { emptyObject, enumFromString } from "@/helpers/type.ts";
import { updateFragmentFromProps } from "@/helpers/slonik.ts";
import { EntityNotFoundException } from "@/exceptions/entity-not-found.exception.ts";

export enum Genre {
  Fantasy = "fantasy",
  SciFi = "sci-fi",
}

export interface BookAlternativeProps {
  name: string;
  urls: string[];
}

export interface CreateBookProps {
  title: string;
  year: number;
  genre?: Genre | null;
  series?: string | null;
  seriesNumber?: string | null;
  isApproved: boolean;
  isPending: boolean;
  alternatives: BookAlternativeProps[];
}

export interface BookProps extends CreateBookProps {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const bookAlternativeDb = z.object({
  name: z.string(),
  urls: z.array(z.string()),
});

// TODO: add author ids
export const bookDb = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number(),
  genre: z.string().nullable(),
  series: z.string().nullable(),
  series_number: z.string().nullable(),
  is_approved: z.boolean(),
  is_pending: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

const sql = createSqlTag({
  typeAliases: {
    bookAlternative: bookAlternativeDb,
    book: bookDb,
    void: z.void(),
    id: z.object({
      id: z.string(),
    }),
  },
});

export async function createBook(
  connection: DatabasePoolConnection,
  props: CreateBookProps,
): Promise<BookProps> {
  return await connection.transaction<BookProps>(async (trConnection) => {
    // deno-fmt-ignore
    const bookResult = await trConnection.query(sql.typeAlias("book")`
      insert into "book" ("title", "year", "genre", "series", "series_number", "is_approved", "is_pending") 
      values (${props.title}, ${props.year}, ${props.genre || null}, ${props.series || null}, ${props.seriesNumber || null}, ${props.isApproved}, ${props.isPending}) returning *
    `);
    const book = bookResult.rows[0];

    if (props.alternatives && props.alternatives.length) {
      // deno-fmt-ignore
      const insertAlternativesSqlFragments = props.alternatives.map(
        (alternative) =>
          sql.fragment`(${book.id}, ${alternative.name}, ${sql.jsonb(alternative.urls)})`
      );
      await trConnection.query(sql.typeAlias("void")`
        insert into "book_alternative" ("book_id", "name", "urls") 
        values ${sql.join(insertAlternativesSqlFragments, sql.fragment`, `)}
      `);
    }

    return {
      id: book.id,
      title: book.title,
      year: book.year,
      genre: book.genre ? enumFromString<Genre>(Genre, book.genre) : null,
      series: book.series,
      seriesNumber: book.series_number,
      isApproved: book.is_approved,
      isPending: book.is_pending,
      createdAt: book.created_at,
      updatedAt: book.updated_at,
      alternatives: props.alternatives,
    };
  });
}

export async function getBookById(
  connection: DatabasePoolConnection,
  id: string,
): Promise<BookProps> {
  const bookResult = await connection.query(sql.typeAlias("book")`
    select * from "book" where "id" = ${id}
  `);
  if (!bookResult.rowCount) {
    throw new EntityNotFoundException("Book not found", { id });
  }
  const alternativeResult = await connection.query(
    sql.typeAlias("bookAlternative")`
    select * from "book_alternative" where "book_id" = ${id}
  `,
  );

  const book = bookResult.rows[0];

  return {
    id: book.id,
    title: book.title,
    year: book.year,
    genre: book.genre ? enumFromString<Genre>(Genre, book.genre) : null,
    series: book.series,
    seriesNumber: book.series_number,
    isApproved: book.is_approved,
    isPending: book.is_pending,
    createdAt: book.created_at,
    updatedAt: book.updated_at,
    alternatives: alternativeResult.rows.map((alternative) => ({
      name: alternative.name,
      urls: alternative.urls,
    })),
  };
}

export async function updateBook(
  connection: DatabasePoolConnection,
  id: string,
  props: Partial<CreateBookProps>,
): Promise<BookProps> {
  if (emptyObject(props)) {
    throw new InvalidArgumentException("No properties to update");
  }

  const bookPropsToUpdate: Record<string, string | number | boolean | null> =
    {};
  ([
    "title",
    "year",
    "genre",
    "series",
    "seriesNumber",
    "isApproved",
    "isPending",
  ] satisfies Partial<keyof CreateBookProps>[])
    .forEach((key) => {
      if (props[key] !== undefined) {
        bookPropsToUpdate[key] = props[key];
      }
    });

  return await connection.transaction<BookProps>(async (trConnection) => {
    let bookResult: QueryResult<z.infer<typeof bookDb>>;
    if (!emptyObject(bookPropsToUpdate)) {
      const updatedPropsFragment = updateFragmentFromProps(bookPropsToUpdate);
      bookResult = await trConnection.query(sql.typeAlias("book")`
        update "book" set ${updatedPropsFragment} where "id" = ${id} returning *
      `);
    } else {
      bookResult = await trConnection.query(sql.typeAlias("book")`
        select * from "book" where "id" = ${id}
      `);
    }

    if (!bookResult.rowCount) {
      throw new EntityNotFoundException("Book not found", { id });
    }

    let alternatives: BookAlternativeProps[] = [];

    if (props.alternatives && props.alternatives.length) {
      await trConnection.query(sql.typeAlias("void")`
        delete from "book_alternative" where "book_id" = ${id}
      `);

      // deno-fmt-ignore
      const insertAlternativesSqlFragments = props.alternatives.map(
        (alternative) =>
          sql.fragment`(${id}, ${alternative.name}, ${sql.jsonb(alternative.urls)})`,
      );

      await trConnection.query(sql.typeAlias("void")`
        insert into "book_alternative" ("book_id", "name", "urls") 
        values ${sql.join(insertAlternativesSqlFragments, sql.fragment`, `)}
      `);

      alternatives = props.alternatives;
    } else {
      const alternativeResult = await trConnection.query(
        sql.typeAlias("bookAlternative")`
        select * from "book_alternative" where "book_id" = ${id}
      `,
      );

      alternatives = alternativeResult.rows.map((alternative) => ({
        name: alternative.name,
        urls: alternative.urls,
      }));
    }

    return {
      id: bookResult.rows[0].id,
      title: bookResult.rows[0].title,
      year: bookResult.rows[0].year,
      genre: bookResult.rows[0].genre
        ? enumFromString<Genre>(Genre, bookResult.rows[0].genre)
        : null,
      series: bookResult.rows[0].series,
      seriesNumber: bookResult.rows[0].series_number,
      isApproved: bookResult.rows[0].is_approved,
      isPending: bookResult.rows[0].is_pending,
      createdAt: bookResult.rows[0].created_at,
      updatedAt: bookResult.rows[0].updated_at,
      alternatives,
    };
  });
}

export async function deleteBook(
  connection: DatabasePoolConnection,
  id: string,
): Promise<void> {
  await connection.query(sql.typeAlias("void")`
    delete from "book" where "id" = ${id}
  `);
}
