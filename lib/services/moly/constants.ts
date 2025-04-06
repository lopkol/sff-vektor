export const molyBaseUrl = "https://moly.hu";

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
