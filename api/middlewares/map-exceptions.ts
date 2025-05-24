import type { ErrorHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { HttpStatusCode } from "../helpers/http-code.ts";
import {
  BaseException,
  UniqueConstraintException,
  ValidationException,
} from "@sffvektor/lib";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { HTTPException } from "hono/http-exception";

// deno-lint-ignore no-explicit-any
export type ExceptionConstructor = new (...args: any[]) => Error;

export type ExceptionRecord = Record<string, ContentfulStatusCode>;

export type ApiError = {
  message: string;
  code?: string;
  details?: unknown;
  stacktrace?: string;
};

class UnknownInternalError extends BaseException {
  constructor() {
    super("Unknown internal error", "UNKNOWN_INTERNAL_ERROR");
  }
}

const defaultExceptionMap: ExceptionRecord = {
  [UniqueConstraintException.name]: HttpStatusCode.Conflict,
  [ValidationException.name]: HttpStatusCode.BadRequest,
};

/**
 * This middleware is meant to be used once globally.
 */
export const handleExceptionMiddleware: ErrorHandler = (error, c) => {
  if (error instanceof HTTPException) {
    return error.getResponse();
  }
  const exceptionMap = c.get("exceptionMap");
  const exceptionHttpStatus = exceptionMap?.[error?.constructor?.name] ??
    defaultExceptionMap[error?.constructor?.name] ??
    HttpStatusCode.InternalServerError;
  let exception: BaseException;
  if (!(error instanceof BaseException)) {
    exception = Object.assign(new UnknownInternalError(), {
      details: {
        message: error.message,
      },
      stack: error.stack,
    });
  } else {
    exception = error;
  }

  const errorPayload: ApiError = {
    message: exception.message,
    code: exception.code,
    details: exception.details ?? null,
    stacktrace: exception.stack, // TODO: remove stacktrace in production
  };
  c.set("error", error); // We store the error in the context to be able to log it in the logger middleware
  return c.json(errorPayload, exceptionHttpStatus);
};

/**
 * Middleware to map specific exceptions to HTTP status codes.
 * This middleware is meant to be used by API routes (not globally).
 * @example
 * ```ts
 * import { EntityNotFoundException, InvalidArgumentException } from "@sffvektor/lib";
 * import { mapExceptions } from "@/middlewares/map-exceptions.ts";
 * import { HttpStatusCode } from "@/helpers/http-code.ts";
 *
 * app.get('/', mapExceptions(
 *   [EntityNotFoundException, HttpStatusCode.NotFound],
 *   [InvalidArgumentException, HttpStatusCode.BadRequest],
 * ), () => {...});
 * ```
 */
export const mapExceptions = (
  ...exceptionMap: [ExceptionConstructor, ContentfulStatusCode][]
) =>
  createMiddleware(async (c, next) => {
    const exceptionRecord = exceptionMap.reduce(
      (acc, [constructor, statusCode]) => {
        acc[constructor.name] = statusCode;
        return acc;
      },
      {} as Record<string, ContentfulStatusCode>,
    );
    c.set("exceptionMap", exceptionRecord);
    await next();
  });

declare module "hono" {
  interface ContextVariableMap {
    exceptionMap?: ExceptionRecord;
  }
}
