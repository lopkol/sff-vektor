import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import { clearDatabase } from "@/setup/clear_database.ts";
import {
  createBookList,
  createOrUpdateBooksOfListFromMoly,
  EntityNotFoundException,
  Genre,
  getBookByMolyId,
  getMolyAxiosInstance,
  getOrCreateDatabasePool,
} from "@sffvektor/lib";
import { stub } from "@std/testing/mock";

const mockList = `
  <html>
    <div class="pagination">
      <a href="/lista/123?page=2">2</a>
      <a class="next_page" href="/lista/123?page=2">Következő</a>
    </div>
    <div class="book_list">
      <div class="book_atom">
        <a data-id="book1" href="/konyvek/book1">Book 1</a>
      </div>
      <div class="book_atom">
        <a data-id="book2" href="/konyvek/book2">Book 2</a>
      </div>
    </div>
  </html>
`;

const mockListPage2 = `
  <html>
    <div class="book_list">
      <div class="book_atom">
        <a data-id="book3" href="/konyvek/book3">Book 3</a>
      </div>
    </div>
  </html>
`;

const mockPendingShelf = `
  <html>
    <div class="pagination">
      <a href="/polc/123?page=2">2</a>
      <a class="next_page" href="/polc/123?page=2">Következő</a>
    </div>
    <div class="tale_item">
      <div class="book_atom">
        <a data-id="book4" href="/konyvek/book4">Book 4</a>
      </div>
      <div class="sticky_note">fantasy vagy nem</div>
    </div>
    <div class="tale_item">
      <div class="book_atom">
        <a data-id="book5" href="/konyvek/book5">Book 5</a>
      </div>
      <div class="sticky_note">young adult vagy fantasy</div>
    </div>
  </html>
`;

const mockPendingShelfPage2 = `
  <html>
    <div class="tale_item">
      <div class="book_atom">
        <a data-id="book6" href="/konyvek/book6">Book 6</a>
      </div>
      <div class="sticky_note">fantasy vagy nem</div>
    </div>
  </html>
`;

const mockPendingShelfWithoutGenre = `
  <html>
    <div class="pagination">
      <a href="/polc/123?page=2">2</a>
      <a class="next_page" href="/polc/123?page=2">Következő</a>
    </div>
    <div class="tale_item">
      <div class="book_atom">
        <a data-id="book4" href="/konyvek/book4">Book 4</a>
      </div>
      <div class="sticky_note">sci-fi</div>
    </div>
    <div class="tale_item">
      <div class="book_atom">
        <a data-id="book5" href="/konyvek/book5">Book 5</a>
      </div>
      <div class="sticky_note">young adult vagy fantasy</div>
    </div>
  </html>
`;

const mockBookHtml = `
  <html>
    <div class="authors"><a href="/alkotok/author1">Author 1</a></div>
    <h1 class="book"><span class="item">Book Title</span></h1>
  </html>
`;

describe("createOrUpdateBooksOfListFromMoly", () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it("creates books from list and pending shelf", async () => {
    const pool = await getOrCreateDatabasePool();
    await createBookList(pool, {
      year: 2024,
      genre: Genre.Fantasy,
      url: "/lista/123",
      pendingUrl: "/polc/123",
      readers: [],
    });

    const axiosGetMock = stub(
      getMolyAxiosInstance(),
      "get",
      (url: string) => {
        let data = mockBookHtml;
        if (url.includes("/lista/123")) {
          data = url.includes("page=2") ? mockListPage2 : mockList;
        }
        if (url.includes("/polc/123")) {
          data = url.includes("page=2")
            ? mockPendingShelfPage2
            : mockPendingShelf;
        }
        // For individual book pages
        return Promise.resolve({
          data,
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        });
      },
    );

    try {
      await createOrUpdateBooksOfListFromMoly(2024, Genre.Fantasy);

      // Verify books were created
      const book1 = await getBookByMolyId(pool, "book1");
      const book2 = await getBookByMolyId(pool, "book2");
      const book3 = await getBookByMolyId(pool, "book3");
      const book4 = await getBookByMolyId(pool, "book4");
      const book5 = await getBookByMolyId(pool, "book5");
      const book6 = await getBookByMolyId(pool, "book6");
      assertExists(book1);
      assertExists(book2);
      assertExists(book3);
      assertExists(book4);
      assertExists(book5);
      assertExists(book6);

      // Verify book properties
      [book1, book2, book3, book4, book5, book6].forEach((book) => {
        assertEquals(book?.year, 2024);
        assertEquals(book?.genre, Genre.Fantasy);
        assertEquals(book?.isApproved, false);
      });

      // Verify pending status
      assertEquals(book1?.isPending, false);
      assertEquals(book2?.isPending, false);
      assertEquals(book3?.isPending, false);
      assertEquals(book4?.isPending, true);
      assertEquals(book5?.isPending, true);
      assertEquals(book6?.isPending, true);
    } finally {
      axiosGetMock.restore();
    }
  });

  it("does not create books from pending shelf if note does not include genre", async () => {
    const pool = await getOrCreateDatabasePool();
    await createBookList(pool, {
      year: 2024,
      genre: Genre.Fantasy,
      url: "/lista/123",
      pendingUrl: "/polc/123",
      readers: [],
    });

    const axiosGetMock = stub(
      getMolyAxiosInstance(),
      "get",
      (url: string) => {
        let data = mockBookHtml;
        if (url.includes("/lista/123")) {
          data = url.includes("page=2") ? mockListPage2 : mockList;
        }
        if (url.includes("/polc/123")) {
          data = url.includes("page=2")
            ? mockPendingShelfPage2
            : mockPendingShelfWithoutGenre;
        }
        // For individual book pages
        return Promise.resolve({
          data,
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        });
      },
    );

    try {
      await createOrUpdateBooksOfListFromMoly(2024, Genre.Fantasy);

      const book = await getBookByMolyId(pool, "book4");
      assertEquals(book, null);
    } finally {
      axiosGetMock.restore();
    }
  });

  it("throws error when booklist does not exist", async () => {
    const axiosGetMock = stub(
      getMolyAxiosInstance(),
      "get",
      () =>
        Promise.resolve({
          data: mockList,
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        }),
    );

    try {
      await assertRejects(
        async () =>
          await createOrUpdateBooksOfListFromMoly(2024, Genre.Fantasy),
        EntityNotFoundException,
      );
    } finally {
      axiosGetMock.restore();
    }
  });
});
