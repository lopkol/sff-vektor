import axios, { type AxiosInstance } from "axios";
import * as rax from "retry-axios";

export const molyBaseUrl = "https://moly.hu";

// A single shared, stateless client for UNAUTHENTICATED scraping of public pages
// (book lists, book pages). No per-caller state, so one instance reused for the
// whole app lifetime is ideal. Authenticated, cookie-bearing sessions are a
// separate concern and are built per session in the moly auth service.
const molyAxios = axios.create();
rax.attach(molyAxios);

export function getMolyAxiosInstance(): AxiosInstance {
  return molyAxios;
}

export const raxConfig = {
  retry: 5,
  retryDelay: 100,
  statusCodesToRetry: [
    [100, 199],
    [400, 429],
    [500, 599],
  ],
  httpMethodsToRetry: ["GET", "POST", "DELETE", "PUT", "PATCH"],
};
