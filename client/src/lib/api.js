import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("chat_token", token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem("chat_token");
  }
}

const savedToken = localStorage.getItem("chat_token");
if (savedToken) {
  setAuthToken(savedToken);
}

export function getGoogleOAuthUrl() {
  if (API_URL.startsWith("http")) {
    return `${API_URL.replace(/\/api\/?$/, "")}/api/auth/google`;
  }
  return "/api/auth/google";
}

