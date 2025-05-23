import axios from "axios";
import * as rax from "retry-axios";

export const molyBaseUrl = "https://moly.hu";

const molyAxios = axios.create();
rax.attach(molyAxios);

export function getMolyAxiosInstance() {
  return molyAxios;
}

export const raxConfig = {
  retry: 5,
  noResponseRetries: 5,
  retryDelay: 100,
  statusCodesToRetry: [
    [100, 199],
    [400, 429],
    [500, 599],
  ],
  httpMethodsToRetry: ["GET", "POST", "DELETE", "PUT", "PATCH"],
};
