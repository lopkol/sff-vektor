import { assertEquals, assertExists, assertObjectMatch } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Hono, type MiddlewareHandler } from "hono";
import { testClient } from "hono/testing";
import {
  type ApiError,
  handleExceptionMiddleware,
  mapExceptions,
} from "@/middlewares/map-exceptions.ts";
import {
  EntityNotFoundException,
  InvalidArgumentException,
  UniqueConstraintException,
  ValidationException,
} from "@sffvektor/lib";
import { HttpStatusCode } from "@/helpers/http-code.ts";
import { ZodError } from "zod";
import { HTTPException } from "hono/http-exception";

const createTestClient = (
  callback: () => void,
  middleware?: MiddlewareHandler,
) => {
  const app = new Hono().get("/", ...(middleware ? [middleware] : []), (c) => {
    callback();
    return c.json({ message: "OK" }, 200);
  });
  app.onError(handleExceptionMiddleware);
  // app.use(mapExceptions([[BaseException, HttpStatusCode.InternalServerError]]));
  return testClient(app);
};

describe("map exceptions middlewares", () => {
  describe("without explicit mapping", () => {
    it("returns unknown internal error with 500 status code when Error is thrown", async () => {
      const client = createTestClient(() => {
        throw new Error("unexpected error");
      });

      const res = await client.index.$get();

      // Assertions
      assertEquals(res.status, 500);
      const body = await res.json();
      assertObjectMatch(body, {
        message: "Unknown internal error",
        code: "UNKNOWN_INTERNAL_ERROR",
        details: {
          message: "unexpected error",
        },
      });
      assertExists((body as ApiError).stacktrace);
    });

    it("returns invalid argument with 500 status code when InvalidArgumentException is thrown", async () => {
      const client = createTestClient(() => {
        throw new InvalidArgumentException("Invalid argument");
      });

      const res = await client.index.$get();

      // Assertions
      assertEquals(res.status, 500);
      const body = await res.json();
      assertObjectMatch(body, {
        message: "Invalid argument",
        code: "INVALID_ARGUMENT",
        details: null,
      });
      assertExists((body as ApiError).stacktrace);
    });

    it("returns entity not found with 500 status code when EntityNotFoundException is thrown", async () => {
      const client = createTestClient(() => {
        throw new EntityNotFoundException("Entity not found");
      });

      const res = await client.index.$get();

      // Assertions
      assertEquals(res.status, 500);
      const body = await res.json();
      assertObjectMatch(body, {
        message: "Entity not found",
        code: "ENTITY_NOT_FOUND",
        details: null,
      });
      assertExists((body as ApiError).stacktrace);
    });

    it("returns validation error with 400 status code when ValidationException is thrown", async () => {
      const client = createTestClient(() => {
        throw new ValidationException(
          new ZodError([{
            code: "custom",
            message: "Custom error",
            path: ["test"],
          }]),
        );
      });

      const res = await client.index.$get();

      // Assertions
      assertEquals(res.status, 400);
      const body = await res.json();
      assertObjectMatch(body, {
        message: "Validation error",
        code: "VALIDATION_ERROR",
        details: {
          issues: [
            {
              message: "Custom error",
              path: ["test"],
            },
          ],
        },
      });
      assertExists((body as ApiError).stacktrace);
    });

    it("returns unique constraint error with 409 status code when UniqueConstraintException is thrown", async () => {
      const client = createTestClient(() => {
        throw new UniqueConstraintException("Unique constraint error", {
          constraint: "test_constraint",
        });
      });

      const res = await client.index.$get();

      // Assertions
      assertEquals(res.status, 409);
      const body = await res.json();
      assertObjectMatch(body, {
        message: "Unique constraint error",
        code: "UNIQUE_CONSTRAINT_VIOLATION",
        details: {
          constraint: "test_constraint",
        },
      });
      assertExists((body as ApiError).stacktrace);
    });

    it("returns the HTTP exception status & payload as it is", async () => {
      const client = createTestClient(() => {
        throw new HTTPException(HttpStatusCode.ImATeapot, {
          message: JSON.stringify({
            info: "I'm a teapot",
          }),
        });
      });

      const res = await client.index.$get();

      // Assertions
      assertEquals(res.status, 418);
      const body = await res.json();
      assertObjectMatch(body, {
        info: "I'm a teapot",
      });
    });
  });

  describe("with explicit mapping", () => {
    it("returns invalid argument with 400 status code when InvalidArgumentException is thrown", async () => {
      const client = createTestClient(
        () => {
          throw new InvalidArgumentException("Invalid argument");
        },
        mapExceptions([InvalidArgumentException, HttpStatusCode.BadRequest]),
      );

      const res = await client.index.$get();

      // Assertions
      assertEquals(res.status, 400);
      const body = await res.json();
      assertObjectMatch(body, {
        message: "Invalid argument",
        code: "INVALID_ARGUMENT",
        details: null,
      });
      assertExists((body as ApiError).stacktrace);
    });

    it("returns entity not found with 404 status code when EntityNotFoundException is thrown", async () => {
      const client = createTestClient(
        () => {
          throw new EntityNotFoundException("Entity not found");
        },
        mapExceptions([EntityNotFoundException, HttpStatusCode.NotFound]),
      );

      const res = await client.index.$get();

      // Assertions
      assertEquals(res.status, 404);
      const body = await res.json();
      assertObjectMatch(body, {
        message: "Entity not found",
        code: "ENTITY_NOT_FOUND",
        details: null,
      });
      assertExists((body as ApiError).stacktrace);
    });
  });
});
