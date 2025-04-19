import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030/api";

// Create an axios instance with default configuration
const http = axios.create({
  // If we are on the server, use the internal API URL is available
  baseURL: typeof window === "undefined"
    ? process.env.INTERNAL_API_URL || API_URL
    : API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor
http.interceptors.request.use(
  async (config) => {
    // Get current auth session
    const session = await getSession();
    // Add auth token if available
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await signOut({ callbackUrl: "/" });
    }
    // Handle common error cases here
    return Promise.reject(error);
  },
);

export default http;
