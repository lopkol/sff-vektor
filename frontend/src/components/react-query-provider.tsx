"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AxiosError } from "axios";

const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: (_failureCount, error) => {
            // Never retry on 4xx errors
            if (
              error instanceof AxiosError && error.status &&
              error.status >= 400 && error.status < 500
            ) {
              return false;
            }
            return true;
          },
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default ReactQueryProvider;
