import z from "zod";
import {
  type CommonQueryMethods,
  createSqlTag,
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
  type BookWithReadingPlan,
  bookWithReadingPlanSchema,
  type CompactBook,
  compactBookSchema,
  type CreateBook,
  type Genre,
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
    bookWithReadingPlan: bookWithReadingPlanSchema,
    void: z.void(),
    id: z.object({
      id: z.string(),
    }),
    bookMolyId: z.object({
      id: z.string(),
      molyId: z.string(),
    }),
  },
});

export async function createBook(
  db: CommonQueryMethods,
  props: CreateBook,
): Promise<Book> {
  return await db.transaction<Book>(async (trConnection) => {
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

// Shared projection + source for the compact-book queries below
const compactBookColumns = sql.fragment`
  b."id",
  b."title",
  b."year",
  b."genre",
  b."series",
  b."seriesNumber",
  b."isApproved" and bool_and(a."isApproved") as "isApproved",
  b."isPending",
  alt."urls",
  array_agg(a."displayName" order by a."sortName") as "authorNames",
  array_agg(a."sortName" order by a."sortName") as "authorSortNames"
`;

const compactBookFrom = sql.fragment`
  from "book" b
  left join lateral (
    select array_agg(u."url" order by
      case ba."name"
        when 'magyar' then 0
        when 'eredeti' then 1
        when 'original' then 2
        else 3
      end,
      ba."name",
      u."ord"
    ) as "urls"
    from "book_alternative" ba
    cross join lateral jsonb_array_elements_text(ba."urls")
      with ordinality as u("url", "ord")
    where ba."bookId" = b."id"
  ) alt on true
  left join "book_author" ba2 on ba2."bookId" = b."id"
  left join "author" a on a."id" = ba2."authorId"
`;

export async function getBooks(
  db: CommonQueryMethods,
  filter: BookFilter,
): Promise<CompactBook[]> {
  const filterFragments = [
    sql.fragment`b."year" = ${filter.year}`,
  ];
  if (filter.genre) {
    filterFragments.push(sql.fragment`b."genre" = ${filter.genre}`);
  }

  const books = await db.query(sql.typeAlias("compactBook")`
    select ${compactBookColumns}
    ${compactBookFrom}
    where ${sql.join(filterFragments, sql.fragment` and `)}
    group by b."id", alt."urls"
    order by b."year", b."genre", "authorSortNames", b."title"
  `);

  return mutable(books.rows);
}

export async function getApprovedBooksWithReadingPlan(
  db: CommonQueryMethods,
  filter: { year: number; genre: Genre; readerId: string },
): Promise<BookWithReadingPlan[]> {
  const books = await db.query(sql.typeAlias("bookWithReadingPlan")`
    select ${compactBookColumns}, rp."status" as "readingPlanStatus"
    ${compactBookFrom}
    left join "reading_plan" rp
      on rp."bookId" = b."id" and rp."readerId" = ${filter.readerId}
    where b."year" = ${filter.year} and b."genre" = ${filter.genre}
    group by b."id", alt."urls", rp."status"
    having b."isApproved" and bool_and(a."isApproved")
    order by b."year", b."genre", "authorSortNames", b."title"
  `);

  return mutable(books.rows);
}

// Books that have a molyId and belong to one of the reader's assigned,
// non-archived book lists. Used by the Moly sync to match a reader's read books
// against the lists they are a jury member of. Books are linked to a list by
// (year, genre); archived lists are frozen and excluded.
export async function getBooksWithMolyIdForReader(
  db: CommonQueryMethods,
  readerId: string,
): Promise<{ id: string; molyId: string }[]> {
  const result = await db.query(sql.typeAlias("bookMolyId")`
    select b."id", b."molyId"
    from "book" b
    join "book_list_reader" blr
      on blr."bookListYear" = b."year" and blr."bookListGenre" = b."genre"
    join "book_list" bl
      on bl."year" = b."year" and bl."genre" = b."genre"
    where blr."readerId" = ${readerId}
      and b."molyId" is not null
      and bl."archivedAt" is null
  `);

  return mutable(result.rows);
}

export async function getBookById(
  db: CommonQueryMethods,
  id: string,
): Promise<Book> {
  const bookResult = await db.query(sql.typeAlias("book")`
    select * from "book" where "id" = ${id}
  `);
  if (!bookResult.rowCount) {
    throw new EntityNotFoundException("Book not found", { id });
  }
  const alternativeResult = await db.query(
    sql.typeAlias(
      "bookAlternative",
    )`select "name", "urls" from "book_alternative" where "bookId" = ${id}`,
  );
  const authorResult = await db.query(
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
  db: CommonQueryMethods,
  molyId: string,
): Promise<Book | null> {
  const bookResult = await db.query(sql.typeAlias("book")`
    select * from "book"
    where "molyId" = ${molyId}
  `);
  if (!bookResult.rowCount) {
    return null;
  }
  const book = bookResult.rows[0];
  const alternativeResult = await db.query(
    sql.typeAlias(
      "bookAlternative",
    )`select "name", "urls" from "book_alternative" where "bookId" = ${book.id}`,
  );
  const authorResult = await db.query(
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
  db: CommonQueryMethods,
  url: string,
): Promise<Book | null> {
  const bookResult = await db.query(sql.typeAlias("book")`
    select b.* from "book" b
    join "book_alternative" ba on ba."bookId" = b."id"
    where ba."urls" @> ${sql.jsonb([url])}
  `);
  if (!bookResult.rowCount) {
    return null;
  }
  const book = bookResult.rows[0];
  const alternativeResult = await db.query(
    sql.typeAlias(
      "bookAlternative",
    )`select "name", "urls" from "book_alternative" where "bookId" = ${book.id}`,
  );
  const authorResult = await db.query(
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
  db: CommonQueryMethods,
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

  return await db.transaction<Book>(async (trConnection) => {
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
  db: CommonQueryMethods,
  id: string,
): Promise<void> {
  await db.query(sql.typeAlias("void")`
    delete from "book" where "id" = ${id}
  `);
}
