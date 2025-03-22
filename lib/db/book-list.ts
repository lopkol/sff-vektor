import { z } from "zod";
import {
  createSqlTag,
  type DatabasePoolConnection,
  type QueryResult,
} from "slonik";
import { EntityNotFoundException } from "@/exceptions/entity-not-found.exception.ts";
import { emptyObject, enumFromString } from "@/helpers/type.ts";
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
import { Genre } from "@/db/book.ts";

export interface UpdateBookListProps {
  url: string;
  pendingUrl: string;
  readers: string[];
}

export interface CreateBookListProps {
  year: number;
  genre: Genre;
  url: string;
  pendingUrl?: string | null;
  readers: string[];
}

export interface BookListProps extends CreateBookListProps {
  createdAt: string;
  updatedAt: string;
}

export interface ShortBookListProps {
  year: number;
  genre: Genre;
}

export const bookListDb = z.object({
  id: z.string(),
  year: z.number(),
  genre: z.string(),
  url: z.string(),
  pending_url: z.string().nullable(),
  reader_ids: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});

export const shortBookListDb = z.object({
  year: z.number(),
  genre: z.string(),
});

const sql = createSqlTag({
  typeAliases: {
    bookList: bookListDb,
    shortBookList: shortBookListDb,
    void: z.void(),
    id: z.object({
      id: z.string(),
    }),
  },
});

export async function createBookList(
  connection: DatabasePoolConnection,
  props: CreateBookListProps,
): Promise<BookListProps> {
  return await connection.transaction<BookListProps>(async (trConnection) => {
    try {
      const bookListResult = await trConnection.query(sql.typeAlias("bookList")`
        insert into book_list (year, genre, url, pending_url)
        values (${props.year}, ${props.genre}, ${props.url}, ${
        props.pendingUrl ?? null
      })
        returning *
      `);
      const bookList = bookListResult.rows[0];

      if (props.readers && props.readers.length) {
        const insertReadersSqlFragments = props.readers.map(
          (readerId) =>
            sql.fragment`(${props.year}, ${props.genre}, ${readerId})`,
        );
        await trConnection.query(sql.typeAlias("void")`
          insert into book_list_reader (book_list_year, book_list_genre, reader_id)
          values ${sql.join(insertReadersSqlFragments, sql.fragment`, `)}
        `);
      }

      return {
        ...props,
        createdAt: bookList.created_at,
        updatedAt: bookList.updated_at,
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
): Promise<BookListProps> {
  const bookListResult = await connection.query(sql.typeAlias("bookList")`
    select 
      bl.*,
      coalesce(array_agg(blr.reader_id) filter (where blr.reader_id is not null), '{}'::uuid[]) as reader_ids
    from book_list bl
    left join book_list_reader blr on bl.year = blr.book_list_year and bl.genre = blr.book_list_genre
    where bl.year = ${year} and bl.genre = ${genre}
    group by bl.year, bl.genre
  `);
  if (!bookListResult.rowCount) {
    throw new EntityNotFoundException("Book list not found", { year, genre });
  }
  const bookList = bookListResult.rows[0];

  return {
    year: bookList.year,
    genre: enumFromString<Genre>(Genre, bookList.genre) ?? Genre.Fantasy,
    url: bookList.url,
    pendingUrl: bookList.pending_url,
    readers: bookList.reader_ids,
    createdAt: bookList.created_at,
    updatedAt: bookList.updated_at,
  };
}

export async function getAllBookLists(
  connection: DatabasePoolConnection,
): Promise<ShortBookListProps[]> {
  const bookListsResult = await connection.query(sql.typeAlias("shortBookList")`
    select "year", "genre"
    from book_list
    order by "year" desc, "genre" desc
  `);

  return bookListsResult.rows.map((bookList) => ({
    year: bookList.year,
    genre: enumFromString<Genre>(Genre, bookList.genre) ?? Genre.Fantasy,
  }));
}

export async function updateBookList(
  connection: DatabasePoolConnection,
  year: number,
  genre: Genre,
  props: Partial<UpdateBookListProps>,
): Promise<BookListProps> {
  return await connection.transaction<BookListProps>(async (trConnection) => {
    if (emptyObject(props)) {
      throw new InvalidArgumentException("No properties to update");
    }
    const bookListPropsToUpdate: Record<string, string> = {};
    ([
      "url",
      "pendingUrl",
    ] satisfies Partial<keyof UpdateBookListProps>[])
      .forEach((key) => {
        if (props[key] !== undefined) {
          bookListPropsToUpdate[key] = props[key];
        }
      });

    return await trConnection.transaction<BookListProps>(
      async (trConnection) => {
        let bookListResult: QueryResult<z.infer<typeof bookListDb>>;
        if (!emptyObject(bookListPropsToUpdate)) {
          const updatedPropsFragment = updateFragmentFromProps(
            bookListPropsToUpdate,
          );
          bookListResult = await trConnection.query(sql.typeAlias("bookList")`
          update book_list set ${updatedPropsFragment}
          where year = ${year} and genre = ${genre} returning *
        `);
        } else {
          bookListResult = await trConnection.query(sql.typeAlias("bookList")`
          select * from book_list where year = ${year} and genre = ${genre}
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
              delete from book_list_reader
              where book_list_year = ${year} and book_list_genre = ${genre}
            `);

            if (props.readers.length) {
              const insertReadersSqlFragments = props.readers.map(
                (readerId) => sql.fragment`(${year}, ${genre}, ${readerId})`,
              );
              await trConnection.query(sql.typeAlias("void")`
              insert into book_list_reader (book_list_year, book_list_genre, reader_id)
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
          select reader_id as id from book_list_reader
          where book_list_year = ${year} and book_list_genre = ${genre}
        `);
          readers = readerResult.rows.map((reader) => reader.id);
        }

        return {
          year: bookList.year,
          genre: enumFromString<Genre>(Genre, bookList.genre) ?? Genre.Fantasy,
          url: bookList.url,
          pendingUrl: bookList.pending_url,
          readers,
          createdAt: bookList.created_at,
          updatedAt: bookList.updated_at,
        };
      },
    );
  });
}

export async function deleteBookList(
  connection: DatabasePoolConnection,
  year: number,
  genre: string,
): Promise<void> {
  await connection.query(sql.typeAlias("void")`
    delete from book_list where year = ${year} and genre = ${genre}
  `);
}
