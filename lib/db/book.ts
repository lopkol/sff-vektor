import z from "zod";
import {
  createSqlTag,
  type DatabasePoolConnection,
  type QueryResult,
} from "slonik";
import { InvalidArgumentException } from "@/exceptions/invalid-argument.exception.ts";
import { emptyObject } from "@/helpers/type.ts";
import {
  getForeignKeyConstraintErrorData,
  getInvalidSyntaxErrorData,
  isForeignKeyConstraintError,
  isInvalidSyntaxError,
  updateFragmentFromProps,
} from "@/helpers/slonik.ts";
import { EntityNotFoundException } from "@/exceptions/entity-not-found.exception.ts";
import {
  type Book,
  type BookAlternative,
  bookAlternativeSchema,
  type BookFilter,
  bookSchema,
  type CompactBook,
  compactBookSchema,
  type CreateBook,
  type UpdateBook,
} from "@/schema/book.ts";
import { mutable } from "@/helpers/type.ts";

const bookDbSchema = bookSchema.omit({
  alternatives: true,
  authors: true,
});

const sql = createSqlTag({
  typeAliases: {
    bookAlternative: bookAlternativeSchema,
    book: bookDbSchema,
    compactBook: compactBookSchema,
    void: z.void(),
    id: z.object({
      id: z.string(),
    }),
  },
});

export async function createBook(
  connection: DatabasePoolConnection,
  props: CreateBook,
): Promise<Book> {
  return await connection.transaction<Book>(async (trConnection) => {
    try {
      const bookResult = await trConnection.query(sql.typeAlias("book")`
        insert into "book" ("molyId", "title", "year", "genre", "series", "seriesNumber", "isApproved", "isPending")
        values (
          ${props.molyId || null},
          ${props.title},
          ${props.year},
          ${props.genre || null},
          ${props.series || null},
          ${props.seriesNumber || null},
          ${props.isApproved},
          ${props.isPending}
          )
        returning *
      `);
      const book = bookResult.rows[0];

      if (props.alternatives && props.alternatives.length) {
        // deno-fmt-ignore
        const insertAlternativesSqlFragments = props.alternatives.map(
          (alternative) =>
            sql.fragment`(${book.id}, ${alternative.name}, ${sql.jsonb(alternative.urls)})`
        );
        await trConnection.query(sql.typeAlias("void")`
          insert into "book_alternative" ("bookId", "name", "urls")
          values ${sql.join(insertAlternativesSqlFragments, sql.fragment`, `)}
        `);
      }

      if (props.authors && props.authors.length) {
        const insertAuthorsSqlFragments = props.authors.map(
          (authorId) => sql.fragment`(${book.id}, ${authorId})`,
        );
        await trConnection.query(sql.typeAlias("void")`
          insert into "book_author" ("bookId", "authorId")
          values ${sql.join(insertAuthorsSqlFragments, sql.fragment`, `)}
        `);
      }

      return {
        ...book,
        alternatives: props.alternatives,
        authors: props.authors,
      };
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new EntityNotFoundException(
          "An author with this id does not exist",
          getForeignKeyConstraintErrorData(error),
        );
      }
      if (isInvalidSyntaxError(error)) {
        throw new InvalidArgumentException(
          "Invalid author id",
          getInvalidSyntaxErrorData(error),
        );
      }
      throw error;
    }
  });
}

export async function getBooks(
  connection: DatabasePoolConnection,
  filter: BookFilter,
): Promise<CompactBook[]> {
  const filterFragments = [
    sql.fragment`b."year" = ${filter.year}`,
  ];
  if (filter.genre) {
    filterFragments.push(sql.fragment`b."genre" = ${filter.genre}`);
  }

  const books = await connection.query(sql.typeAlias("compactBook")`
    select
      b."id",
      b."title",
      b."year",
      b."genre",
      b."series",
      b."seriesNumber",
      b."isApproved" and bool_and(a."isApproved") as "isApproved",
      b."isPending",
      ba."urls",
      array_agg(a."displayName" order by a."sortName") as "authorNames",
      array_agg(a."sortName" order by a."sortName") as "authorSortNames"
    from "book" b
    left join "book_alternative" ba on ba."bookId" = b."id" and ba."name" = 'magyar'
    left join "book_author" ba2 on ba2."bookId" = b."id"
    left join "author" a on a."id" = ba2."authorId"
    where ${sql.join(filterFragments, sql.fragment` and `)}
    group by b."id", ba."urls"
    order by b."year", b."genre", "authorSortNames", b."title"
  `);

  return mutable(books.rows);
}

export async function getBookById(
  connection: DatabasePoolConnection,
  id: string,
): Promise<Book> {
  const bookResult = await connection.query(sql.typeAlias("book")`
    select * from "book" where "id" = ${id}
  `);
  if (!bookResult.rowCount) {
    throw new EntityNotFoundException("Book not found", { id });
  }
  const alternativeResult = await connection.query(
    sql.typeAlias(
      "bookAlternative",
    )`select "name", "urls" from "book_alternative" where "bookId" = ${id}`,
  );
  const authorResult = await connection.query(
    sql.typeAlias(
      "id",
    )`select "authorId" as id from "book_author" where "bookId" = ${id}`,
  );

  return {
    ...bookResult.rows[0],
    alternatives: [...alternativeResult.rows],
    authors: authorResult.rows.map((row) => row.id),
  };
}

export async function getBookByMolyId(
  connection: DatabasePoolConnection,
  molyId: string,
): Promise<Book | null> {
  const bookResult = await connection.query(sql.typeAlias("book")`
    select * from "book"
    where "molyId" = ${molyId}
  `);
  if (!bookResult.rowCount) {
    return null;
  }
  const book = bookResult.rows[0];
  const alternativeResult = await connection.query(
    sql.typeAlias(
      "bookAlternative",
    )`select "name", "urls" from "book_alternative" where "bookId" = ${book.id}`,
  );
  const authorResult = await connection.query(
    sql.typeAlias(
      "id",
    )`select "authorId" as id from "book_author" where "bookId" = ${book.id}`,
  );

  return {
    ...bookResult.rows[0],
    alternatives: [...alternativeResult.rows],
    authors: authorResult.rows.map((row) => row.id),
  };
}

export async function getBookByUrl(
  connection: DatabasePoolConnection,
  url: string,
): Promise<Book | null> {
  const bookResult = await connection.query(sql.typeAlias("book")`
    select b.* from "book" b
    join "book_alternative" ba on ba."bookId" = b."id"
    where ba."urls" @> ${sql.jsonb([url])}
  `);
  if (!bookResult.rowCount) {
    return null;
  }
  const book = bookResult.rows[0];
  const alternativeResult = await connection.query(
    sql.typeAlias(
      "bookAlternative",
    )`select "name", "urls" from "book_alternative" where "bookId" = ${book.id}`,
  );
  const authorResult = await connection.query(
    sql.typeAlias(
      "id",
    )`select "authorId" as id from "book_author" where "bookId" = ${book.id}`,
  );

  return {
    ...bookResult.rows[0],
    alternatives: [...alternativeResult.rows],
    authors: authorResult.rows.map((row) => row.id),
  };
}

export async function updateBook(
  connection: DatabasePoolConnection,
  id: string,
  props: UpdateBook,
): Promise<Book> {
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
  ] satisfies Partial<keyof UpdateBook>[])
    .forEach((key) => {
      if (props[key] !== undefined) {
        bookPropsToUpdate[key] = props[key];
      }
    });

  return await connection.transaction<Book>(async (trConnection) => {
    try {
      let bookResult: QueryResult<z.infer<typeof bookDbSchema>>;
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

      let alternatives: BookAlternative[] = [];

      if (props.alternatives) {
        await trConnection.query(sql.typeAlias("void")`
          delete from "book_alternative" where "bookId" = ${id}
        `);

        if (props.alternatives.length) {
          // deno-fmt-ignore
          const insertAlternativesSqlFragments = props.alternatives.map((alternative) =>
            sql.fragment`(${id}, ${alternative.name}, ${sql.jsonb(alternative.urls)})`,
          );

          await trConnection.query(sql.typeAlias("void")`
            insert into "book_alternative" ("bookId", "name", "urls")
            values ${sql.join(insertAlternativesSqlFragments, sql.fragment`, `)}
          `);
        }

        alternatives = props.alternatives;
      } else {
        const alternativeResult = await trConnection.query(
          sql.typeAlias("bookAlternative")`
          select "name", "urls" from "book_alternative" where "bookId" = ${id}
        `,
        );

        alternatives = [...alternativeResult.rows];
      }

      let authors: string[] = [];

      if (props.authors) {
        await trConnection.query(sql.typeAlias("void")`
          delete from "book_author" where "bookId" = ${id}
        `);

        if (props.authors.length) {
          const insertAuthorsSqlFragments = props.authors.map(
            (authorId) => sql.fragment`(${id}, ${authorId})`,
          );

          await trConnection.query(sql.typeAlias("void")`
            insert into "book_author" ("bookId", "authorId")
            values ${sql.join(insertAuthorsSqlFragments, sql.fragment`, `)}
          `);
        }

        authors = props.authors;
      } else {
        const authorResult = await trConnection.query(
          sql.typeAlias(
            "id",
          )`select "authorId" as id from "book_author" where "bookId" = ${id}`,
        );
        authors = authorResult.rows.map((row) => row.id);
      }

      return {
        ...bookResult.rows[0],
        alternatives,
        authors,
      };
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new EntityNotFoundException(
          "An author with this id does not exist",
          getForeignKeyConstraintErrorData(error),
        );
      }
      if (isInvalidSyntaxError(error)) {
        throw new InvalidArgumentException(
          "Invalid author id",
          getInvalidSyntaxErrorData(error),
        );
      }
      throw error;
    }
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
