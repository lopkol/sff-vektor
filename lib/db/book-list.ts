import { z } from "zod";
import {
  createSqlTag,
  type DatabasePoolConnection,
  type QueryResult,
} from "slonik";
import { EntityNotFoundException } from "@/exceptions/entity-not-found.exception.ts";
import { emptyObject, mutable } from "@/helpers/type.ts";
import { InvalidArgumentException } from "@/exceptions/invalid-argument.exception.ts";
import {
  getForeignKeyConstraintErrorData,
  getInvalidSyntaxErrorData,
  isForeignKeyConstraintError,
  isInvalidSyntaxError,
  isUniqueConstraintError,
  updateFragmentFromProps,
} from "@/helpers/slonik.ts";
import { UniqueConstraintException } from "@/exceptions/unique-constraint.exception.ts";
import type { Genre } from "@/schema/book.ts";
import {
  type BookList,
  bookListSchema,
  type CreateBookList,
  type ShortBookList,
  shortBookListSchema,
  type UpdateBookList,
} from "@/schema/book-list.ts";

const bookListDbSchema = bookListSchema.omit({
  readers: true,
});

const sql = createSqlTag({
  typeAliases: {
    bookList: bookListDbSchema,
    shortBookList: shortBookListSchema,
    bookListWithReaders: bookListSchema,
    void: z.void(),
    id: z.object({
      id: z.string(),
    }),
  },
});

export async function createBookList(
  connection: DatabasePoolConnection,
  props: CreateBookList,
): Promise<BookList> {
  return await connection.transaction<BookList>(async (trConnection) => {
    try {
      // deno-fmt-ignore
      const bookListResult = await trConnection.query(sql.typeAlias("bookList")`
        insert into "book_list" ("year", "genre", "url", "pendingUrl")
        values (${props.year}, ${props.genre}, ${props.url}, ${props.pendingUrl ?? null})
        returning *
      `);
      const bookList = bookListResult.rows[0];

      if (props.readers && props.readers.length) {
        const insertReadersSqlFragments = props.readers.map(
          (readerId) =>
            sql.fragment`(${props.year}, ${props.genre}, ${readerId})`,
        );
        await trConnection.query(sql.typeAlias("void")`
          insert into "book_list_reader" ("bookListYear", "bookListGenre", "readerId")
          values ${sql.join(insertReadersSqlFragments, sql.fragment`, `)}
        `);
      }

      return {
        ...bookList,
        readers: props.readers,
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new UniqueConstraintException(
          "A book list with this year and genre already exists",
          { year: props.year, genre: props.genre },
        );
      }
      if (isForeignKeyConstraintError(error)) {
        throw new EntityNotFoundException(
          "A reader with this id does not exist",
          getForeignKeyConstraintErrorData(error),
        );
      }
      if (isInvalidSyntaxError(error)) {
        throw new InvalidArgumentException("Invalid reader id", {
          readerId: getInvalidSyntaxErrorData(error),
        });
      }
      throw error;
    }
  });
}

export async function getBookList(
  connection: DatabasePoolConnection,
  year: number,
  genre: Genre,
): Promise<BookList> {
  const bookListResult = await connection.query(
    sql.typeAlias("bookListWithReaders")`
    select 
      bl.*,
      coalesce(array_agg(blr."readerId") filter (where blr."readerId" is not null), '{}'::uuid[]) as readers
    from "book_list" bl
    left join "book_list_reader" blr on bl."year" = blr."bookListYear" and bl."genre" = blr."bookListGenre"
    where bl."year" = ${year} and bl."genre" = ${genre}
    group by bl."year", bl."genre"
  `,
  );
  if (!bookListResult.rowCount) {
    throw new EntityNotFoundException("Book list not found", { year, genre });
  }

  return bookListResult.rows[0];
}

export async function getAllBookLists(
  connection: DatabasePoolConnection,
): Promise<ShortBookList[]> {
  const bookListsResult = await connection.query(sql.typeAlias("shortBookList")`
    select "year", "genre", "url", "pendingUrl"
    from "book_list"
    order by "year" desc, "genre" desc
  `);

  return mutable(bookListsResult.rows);
}

export async function updateBookList(
  connection: DatabasePoolConnection,
  year: number,
  genre: Genre,
  props: Partial<UpdateBookList>,
): Promise<BookList> {
  if (emptyObject(props)) {
    throw new InvalidArgumentException("No properties to update");
  }
  const bookListPropsToUpdate: Record<string, string | Genre | null> = {};
  ([
    "url",
    "pendingUrl",
  ] satisfies Partial<keyof UpdateBookList>[])
    .forEach((key) => {
      if (props[key] !== undefined) {
        bookListPropsToUpdate[key] = props[key];
      }
    });

  return await connection.transaction<BookList>(async (trConnection) => {
    let bookListResult: QueryResult<z.infer<typeof bookListDbSchema>>;
    if (!emptyObject(bookListPropsToUpdate)) {
      const updatedPropsFragment = updateFragmentFromProps(
        bookListPropsToUpdate,
      );
      bookListResult = await trConnection.query(sql.typeAlias("bookList")`
        update "book_list" set ${updatedPropsFragment}
        where "year" = ${year} and "genre" = ${genre} returning *
      `);
    } else {
      bookListResult = await trConnection.query(sql.typeAlias("bookList")`
        select * from "book_list" where "year" = ${year} and "genre" = ${genre}
      `);
    }

    if (!bookListResult.rowCount) {
      throw new EntityNotFoundException("Book list not found", {
        year,
        genre,
      });
    }

    const bookList = bookListResult.rows[0];

    let readers: string[] = [];
    if (props.readers) {
      try {
        await trConnection.query(sql.typeAlias("void")`
          delete from "book_list_reader"
          where "bookListYear" = ${year} and "bookListGenre" = ${genre}
        `);

        if (props.readers.length) {
          const insertReadersSqlFragments = props.readers.map(
            (readerId) => sql.fragment`(${year}, ${genre}, ${readerId})`,
          );
          await trConnection.query(sql.typeAlias("void")`
            insert into "book_list_reader" ("bookListYear", "bookListGenre", "readerId")
            values ${sql.join(insertReadersSqlFragments, sql.fragment`, `)}
          `);
        }
      } catch (error) {
        if (isForeignKeyConstraintError(error)) {
          throw new EntityNotFoundException(
            "A reader with this id does not exist",
            getForeignKeyConstraintErrorData,
          );
        }
        if (isInvalidSyntaxError(error)) {
          throw new InvalidArgumentException("Invalid reader id", {
            readerId: getInvalidSyntaxErrorData(error),
          });
        }
        throw error;
      }

      readers = props.readers;
    } else {
      const readerResult = await trConnection.query(sql.typeAlias("id")`
        select "readerId" as id from "book_list_reader"
        where "bookListYear" = ${year} and "bookListGenre" = ${genre}
      `);
      readers = readerResult.rows.map((reader) => reader.id);
    }

    return {
      ...bookList,
      readers,
    };
  });
}

export async function deleteBookList(
  connection: DatabasePoolConnection,
  year: number,
  genre: Genre,
): Promise<void> {
  await connection.query(sql.typeAlias("void")`
    delete from "book_list" where "year" = ${year} and "genre" = ${genre}
  `);
}
