import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 60_000, // 60 seconds (allows cloud free-tier cold starts like Render to wake up)
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error normalizer
api.interceptors.response.use(
  (res) => res,
  (err) => {
    let message =
      err.response?.data?.detail ??
      err.message ??
      "Network error. Please try again.";

    if (err.code === "ECONNABORTED" || message.toLowerCase().includes("timeout")) {
      message = "Server is waking up (free tier cold-start). Please wait a few seconds and try again.";
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
