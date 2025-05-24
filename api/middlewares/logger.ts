import type { Context, MiddlewareHandler, Next } from "hono";
import { getPath } from "hono/utils/url";
import { performance } from "node:perf_hooks";
import { logger } from "@sffvektor/lib";
import { withContext } from "@logtape/logtape";

export const requestResponseLogs = (
  {
    disableIncomingRequestLog = false,
    disableRequestCompletedLog = false,
    disableRequestFailedLog = false,
  } = {},
): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    const { method } = c.req;
    const path = getPath(c.req.raw);
    const requestId = c.get("requestId");
    const logCtx = {
      requestId,
      method,
      path,
    };
    const loggerCtx = logger.with(logCtx);

    if (!disableIncomingRequestLog) {
      loggerCtx.info(
        `[${method} ${path}] Request started`,
      );
    }

    const start = performance.now();

    // Run the rest of the handlers chain with the log context
    await withContext(logCtx, async () => {
      await next();
    });

    const { status } = c.res;
    const error = c.get("error");

    if (!disableRequestFailedLog && error) {
      loggerCtx.error(
        `[${method} ${path}] Request failed`,
        {
          status,
          error: {
            message: error instanceof Error ? error.message : error,
            stack: error.stack,
          },
        },
      );
    } else if (!disableRequestCompletedLog && !error) {
      loggerCtx.info(
        `[${method} ${path}] Request completed`,
        {
          status,
          time: time(start),
        },
      );
    }
  };
};

function humanize(times: string[]): string {
  const [delimiter, separator] = [",", "."];
  const orderTimes = times.map((v) =>
    v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${delimiter}`)
  );

  return orderTimes.join(separator);
}

function time(start: number): string {
  const delta = performance.now() - start;

  return humanize([
    delta < 1000 ? `${delta}ms` : `${Math.round(delta / 1000)}s`,
  ]);
}
