import axios from "axios";

// Create an axios instance with default configuration
const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor
http.interceptors.request.use(
  (config) => {
    // You can add common request handling here
    // For example, adding auth tokens
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
http.interceptors.response.use(
  (response) => {
    // You can transform response data here if needed
    return response.data;
  },
  (error) => {
    // Handle common error cases here
    return Promise.reject(error);
  }
);

export default http;
