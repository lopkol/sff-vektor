import axios from "axios";
import { getSession, signOut } from "next-auth/react";

// Create an axios instance with default configuration
const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030/api",
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
    if (error.response.status === 401) {
      await signOut({ callbackUrl: "/" });
    }
    // Handle common error cases here
    return Promise.reject(error);
  },
);

export default http;
