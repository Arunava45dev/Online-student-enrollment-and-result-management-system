import axios from "axios";

// Base URL comes from .env — VITE_API_BASE_URL. Defaults to local FastAPI dev server.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const client = axios.create({ baseURL: BASE_URL });

// Attach the JWT (if present) to every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("ser_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, drop the stored session so the app falls back to /login.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("ser_token");
      localStorage.removeItem("ser_role");
      localStorage.removeItem("ser_name");
    }
    return Promise.reject(err);
  }
);

// Pulls a readable message out of FastAPI's error shapes,
// including the HTTPValidationError / ValidationError list format.
export function extractErrorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (!detail) return err?.message || "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => (typeof d === "string" ? d : d.msg || JSON.stringify(d))).join(" · ");
  }
  return JSON.stringify(detail);
}

export default client;
