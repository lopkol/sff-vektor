import merge from "lodash/merge";
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, supportedLocales } from "./locales";
import huLocale from "../../locales/hu.json";
import enLocale from "../../locales/en.json";

const messagesByLocale = {
  en: enLocale,
  // Fallback to EN messages if locale is partially translated
  // TODO: once the app is fully translated, make hungarian the default fallback
  hu: merge({}, enLocale, huLocale),
};

export default getRequestConfig(async () => {
  let currentUserLocale = (await cookies())?.get("USER_LOCALE")?.value;
  if (currentUserLocale && !supportedLocales.includes(currentUserLocale)) {
    currentUserLocale = undefined;
  }
  const locale = currentUserLocale || defaultLocale;
  const messages = messagesByLocale[locale as keyof typeof messagesByLocale];

  return {
    locale,
    locales: supportedLocales,
    messages,
    timeZone: "Europe/Paris",
  };
});
