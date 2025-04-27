import { assertEquals, assertExists } from "@std/assert";
import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import { clearDatabase } from "@/setup/clear_database.ts";
import {
  createBook,
  createOrUpdateBookFromMoly,
  Genre,
  getBookByMolyId,
  getMolyAxiosInstance,
  getOrCreateDatabasePool,
  molyBaseUrl,
} from "@sffvektor/lib";
import { stub } from "@std/testing/mock";

const mockHtml = `
  <html>
    <div class="authors"><br class="mobile_only"><a href="/alkotok/terry-pratchett">Terry Pratchett</a><span class="dot"> · </span><a href="/alkotok/stephen-baxter">Stephen Baxter</a></div>
    <h1 class="book"><span class="item">A ​Hosszú Kozmosz <a rel="modal" class="action" href="/sorozatok/a-hosszu-fold">(A Hosszú Föld 5.)</a> </span><span class="stat"><span class="rating"><span class="like_count" title="Értékelések átlaga (olvasottsággal korrigált átlag: 79,57%)">79%</span></span> <a class="statistic_link modal" href="/konyvek/terry-pratchett-stephen-baxter-a-hosszu-kozmosz/statisztika">27 csillagozás</a></span> </h1>
    <div class="databox clearfix"><div class="small_covers left"><div class="book_with_shop"><a rel="light" class="zoom" href="/system/covers/big/covers_388798.jpg?1459602893"></a><a href="/konyvek/terry-pratchett-stephen-baxter-the-long-cosmos"><img alt="Terry Pratchett – Stephen Baxter: The Long Cosmos" title="Terry Pratchett - Stephen Baxter: The Long Cosmos" class="tooltip" src="https://assets.moly.hu/system/covers/normal/covers_388798.jpg?1459602893"></a></div></div><h3>Eredeti mű</h3><div><a class="book_selector" data-id="291607" href="/konyvek/terry-pratchett-stephen-baxter-the-long-cosmos">Terry Pratchett – Stephen Baxter: The Long Cosmos</a> </div></div>
  </html>
`;

describe("createOrUpdateBookFromMoly", () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it("creates a new book with author and alternatives", async () => {
    const axiosGetMock = stub(
      getMolyAxiosInstance(),
      "get",
      () =>
        Promise.resolve({
          data: mockHtml,
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        }),
    );

    try {
      await createOrUpdateBookFromMoly(
        `${molyBaseUrl}/book/123`,
        1937,
        Genre.Fantasy,
        "123",
      );

      const pool = await getOrCreateDatabasePool();
      const book = await getBookByMolyId(pool, "123");
      assertExists(book);
      assertEquals(book?.title, "A Hosszú Kozmosz");
      assertEquals(book?.year, 1937);
      assertEquals(book?.genre, Genre.Fantasy);
      assertEquals(book?.series, "A Hosszú Föld");
      assertEquals(book?.seriesNumber, "5");
      assertEquals(book?.isApproved, false);
      assertEquals(book?.isPending, false);
      assertEquals(book?.alternatives.length, 2);
      assertEquals(book?.authors.length, 2);
    } finally {
      axiosGetMock.restore();
    }
  });

  it("updates existing book data", async () => {
    const pool = await getOrCreateDatabasePool();
    await createBook(pool, {
      molyId: "123",
      title: "A Hosszú Kozmosz",
      year: 1937,
      genre: Genre.Fantasy,
      series: null,
      seriesNumber: null,
      isApproved: false,
      isPending: false,
      alternatives: [],
      authors: [],
    });
    const axiosGetMock = stub(
      getMolyAxiosInstance(),
      "get",
      () =>
        Promise.resolve({
          data: mockHtml,
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        }),
    );

    try {
      await createOrUpdateBookFromMoly(
        `${molyBaseUrl}/book/123`,
        1937,
        Genre.Fantasy,
        "123",
      );
    } finally {
      axiosGetMock.restore();
    }

    const book = await getBookByMolyId(pool, "123");
    assertExists(book);
    assertEquals(book?.title, "A Hosszú Kozmosz");
    assertEquals(book?.year, 1937);
    assertEquals(book?.genre, Genre.Fantasy);
    assertEquals(book?.series, "A Hosszú Föld");
    assertEquals(book?.seriesNumber, "5");
    assertEquals(book?.isApproved, false);
    assertEquals(book?.isPending, false);
    assertEquals(book?.alternatives.length, 2);
    assertEquals(book?.authors.length, 2);
  });

  it("only updates pending status of an approved book, not the data", async () => {
    const pool = await getOrCreateDatabasePool();
    await createBook(pool, {
      molyId: "123",
      title: "A Hosszú Kozmosz",
      year: 1937,
      genre: Genre.Fantasy,
      series: null,
      seriesNumber: null,
      isApproved: true,
      isPending: true,
      alternatives: [],
      authors: [],
    });
    const axiosGetMock = stub(
      getMolyAxiosInstance(),
      "get",
      () =>
        Promise.resolve({
          data: mockHtml,
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        }),
    );

    try {
      await createOrUpdateBookFromMoly(
        `${molyBaseUrl}/book/123`,
        1937,
        Genre.Fantasy,
        "123",
        false,
      );
    } finally {
      axiosGetMock.restore();
    }

    const book = await getBookByMolyId(pool, "123");
    assertExists(book);
    assertEquals(book?.title, "A Hosszú Kozmosz");
    assertEquals(book?.year, 1937);
    assertEquals(book?.genre, Genre.Fantasy);
    assertEquals(book?.series, null);
    assertEquals(book?.seriesNumber, null);
    assertEquals(book?.isApproved, true);
    assertEquals(book?.isPending, false);
    assertEquals(book?.alternatives.length, 0);
    assertEquals(book?.authors.length, 0);
  });
});
