import {
  configure,
  type FormattedValues,
  getAnsiColorFormatter,
  getConsoleSink,
  getTextFormatter,
  type LogLevel,
  type LogRecord,
} from "@logtape/logtape";
import { AsyncLocalStorage } from "node:async_hooks";

export async function setupLogger({
  level,
  prettyPrint,
  useColors,
}: {
  level: LogLevel;
  prettyPrint?: boolean;
  useColors?: boolean;
} = {
  level: "debug",
  prettyPrint: false,
  useColors: true,
}) {
  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: prettyPrint && useColors
          ? getAnsiColorFormatter({
            level: "FULL",
            format: customFormat,
          })
          : prettyPrint
          ? getTextFormatter({
            level: "FULL",
            format: customFormat,
          })
          : jsonTextFormatter,
      }),
    },
    loggers: [
      { category: "default", lowestLevel: level, sinks: ["console"] },
      // Disable logtape meta logs unless it's an error or worse
      {
        category: ["logtape", "meta"],
        lowestLevel: "error",
        sinks: ["console"],
      },
    ],
    contextLocalStorage: new AsyncLocalStorage(),
  });
}

function customFormat(
  { timestamp, level, message, record }: FormattedValues,
): string {
  return `${timestamp} ${level} ${message}${
    record.properties && Object.keys(record.properties).length > 0
      ? ` ${JSON.stringify(record.properties)}`
      : ""
  }`;
}

function jsonTextFormatter(record: LogRecord): string {
  return `${JSON.stringify(record)}\n`;
}
