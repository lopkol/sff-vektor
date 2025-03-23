import merge from "lodash/merge";
import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, supportedLocales } from "./locales";
import enLocale from "../../locales/en.json";

export default getRequestConfig(async () => {
  const headersList = await headers();

  let currentUserLocale = (await cookies())?.get("USER_LOCALE")?.value;
  if (currentUserLocale && !supportedLocales.includes(currentUserLocale)) {
    currentUserLocale = undefined;
  }
  const locale =
    currentUserLocale ||
    getLocaleFromHeaders(headersList, supportedLocales) ||
    defaultLocale;
  // Fallback to EN messages if locale is partially translated
  // FIXME: once the app is fully translated, make hungarian the default fallback
  const messages =
    locale === "en"
      ? enLocale
      : merge(enLocale, await import(`../../locales/${locale}.json`));

  return {
    locale,
    locales: supportedLocales,
    messages,
    timeZone: "Europe/Paris",
  };
});

/**
 * Extracts the locales from the header `accept-language`
 * and returns the first one that is in the supportedLocales array
 * The header contains values like:
 *  - en-US,en;q=0.9,hu;q=0.8,fr;q=0.7
 *  - fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7
 * For more details, see: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Language
 */
function getLocaleFromHeaders(
  headersList: Headers,
  supportedLocales: string[],
) {
  const defaultUserLocales = headersList.get("accept-language");
  if (!defaultUserLocales) {
    return null;
  }
  const locales = defaultUserLocales.split(";").map((headerValue) => {
    // Get base locale without quality value
    const locales = headerValue.split(",");
    const fullCode = locales[locales.length - 1];
    // Get both full code (en-US) and language only (en)
    const locale = fullCode.length === 2 ? fullCode : fullCode.split("-")[0];
    return locale;
  });

  // Find first matching locale
  const match = locales.find((locale) => supportedLocales.includes(locale));

  return match;
}
