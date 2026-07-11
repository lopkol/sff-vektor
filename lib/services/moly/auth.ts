// @ts-types="npm:@types/jsdom"
import { JSDOM } from "jsdom";
import axios, { type AxiosInstance } from "axios";
import * as rax from "retry-axios";
import { molyBaseUrl, raxConfig } from "@/config/moly-axios.ts";
import { logger } from "@/helpers/logger.ts";

// The subset of an authenticated Moly client that sync services need. Kept
// minimal so tests can supply a lightweight fake instead of a real axios client.
export type MolyClient = Pick<AxiosInstance, "get">;

// A Moly client that persists cookies across requests, needed to keep a
// logged-in session (the login sets a session cookie that authenticates
// subsequent requests, e.g. to read a member's private reading list). Cookies
// are tracked by name in a small in-memory store via interceptors, so no
// external cookie-jar dependency is needed for this simple single-session flow.
//
// A new instance is created per session: all requests within
// one authenticated run share it.
function createMolyClientWithCookies(): AxiosInstance {
  const client = axios.create({ baseURL: molyBaseUrl });
  rax.attach(client);

  const cookies = new Map<string, string>();

  client.interceptors.request.use((config) => {
    if (cookies.size) {
      config.headers.set(
        "Cookie",
        Array.from(cookies, ([name, value]) => `${name}=${value}`).join("; "),
      );
    }
    return config;
  });

  client.interceptors.response.use((response) => {
    const setCookie = response.headers["set-cookie"];
    const rawCookies = Array.isArray(setCookie)
      ? setCookie
      : setCookie
      ? [setCookie]
      : [];
    for (const rawCookie of rawCookies) {
      // Keep only the "name=value" part, dropping attributes (path, HttpOnly…).
      const [pair] = rawCookie.split(";");
      const separatorIndex = pair.indexOf("=");
      if (separatorIndex > 0) {
        cookies.set(
          pair.slice(0, separatorIndex).trim(),
          pair.slice(separatorIndex + 1).trim(),
        );
      }
    }
    return response;
  });

  return client;
}

// Logs in to Moly with the MOLY_USERNAME / MOLY_PASSWORD credentials and returns
// a cookie-persisting client. This is the single entry point for any
// authenticated Moly access: each call starts a fresh session (see
// createMolyClientWithCookies for why authenticated clients are per-session
// rather than the shared, unauthenticated singleton).
//
// Moly's login is a standard Rails form post: we read the CSRF token from the
// login page, then post the credentials.
export async function loginToMoly(): Promise<AxiosInstance> {
  const email = Deno.env.get("MOLY_USERNAME");
  const password = Deno.env.get("MOLY_PASSWORD");
  if (!email || !password) {
    logger.error(
      "Cannot log in to Moly: MOLY_USERNAME / MOLY_PASSWORD are not set",
    );
    throw new Error(
      "MOLY_USERNAME and MOLY_PASSWORD must be set for authenticated Moly access",
    );
  }

  const client = createMolyClientWithCookies();

  const loginPage = await client.get("/belepes", { raxConfig });
  const { document } = new JSDOM(loginPage.data).window;
  const csrfToken = document
    .querySelector('form.new_user_session input[name="authenticity_token"]')
    ?.getAttribute("value");
  if (!csrfToken) {
    logger.error(
      "Cannot log in to Moly: the CSRF token was not found on the login page",
    );
    throw new Error("Could not find the Moly login CSRF token");
  }

  const form = new URLSearchParams({
    "utf8": "✓",
    "authenticity_token": csrfToken,
    "user_session[email]": email,
    "user_session[password]": password,
    "commit": "Belépés",
  });

  // Do not follow the redirect: on success Moly replies 302 and sets the
  // authenticated session cookie on that response, which we must capture. On
  // failure it re-renders the login page with 200.
  const loginResult = await client.post("/azonositas", form.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400,
    raxConfig,
  });

  if (loginResult.status < 300) {
    logger.error(
      "Moly login failed: expected a redirect but got a non-redirect response",
      { status: loginResult.status },
    );
    throw new Error(
      "Moly login failed - check the MOLY_USERNAME / MOLY_PASSWORD credentials",
    );
  }

  return client;
}
