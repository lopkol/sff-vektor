import z from "zod";
import {
  createSqlTag,
  type DatabasePoolConnection,
  type QueryResult,
} from "slonik";
import { InvalidArgumentException } from "@/exceptions/invalid-argument.exception.ts";
import { emptyObject } from "@/helpers/type.ts";
import { updateFragmentFromProps } from "@/helpers/slonik.ts";
import { EntityNotFoundException } from "@/exceptions/entity-not-found.exception.ts";
import {
  type Book,
  type BookAlternative,
  bookAlternativeSchema,
  bookSchema,
  type CreateBook,
  type UpdateBook,
} from "@/schema/book.ts";

const bookDbSchema = bookSchema.omit({
  alternatives: true,
});

const sql = createSqlTag({
  typeAliases: {
    bookAlternative: bookAlternativeSchema,
    book: bookDbSchema,
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
    // deno-fmt-ignore
    const bookResult = await trConnection.query(sql.typeAlias("book")`
      insert into "book" ("title", "year", "genre", "series", "seriesNumber", "isApproved", "isPending") 
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
        insert into "book_alternative" ("bookId", "name", "urls") 
        values ${sql.join(insertAlternativesSqlFragments, sql.fragment`, `)}
      `);
    }

    return {
      ...book,
      alternatives: props.alternatives,
    };
  });
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
    sql.typeAlias("bookAlternative")`
    select "name", "urls" from "book_alternative" where "bookId" = ${id}
  `,
  );

  const book = bookResult.rows[0];

  return {
    ...book,
    alternatives: [...alternativeResult.rows],
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

    return {
      ...bookResult.rows[0],
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
