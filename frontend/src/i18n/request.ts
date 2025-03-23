import merge from "lodash/merge";
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, supportedLocales } from "./locales";
import enLocale from "../../locales/en.json";

export default getRequestConfig(async () => {
  let currentUserLocale = (await cookies())?.get("USER_LOCALE")?.value;
  if (currentUserLocale && !supportedLocales.includes(currentUserLocale)) {
    currentUserLocale = undefined;
  }
  const locale = currentUserLocale || defaultLocale;
  // Fallback to EN messages if locale is partially translated
  // FIXME: once the app is fully translated, make hungarian the default fallback
  const messages = locale === "en"
    ? enLocale
    : merge(enLocale, await import(`../../locales/${locale}.json`));

  return {
    locale,
    locales: supportedLocales,
    messages,
    timeZone: "Europe/Paris",
  };
});
