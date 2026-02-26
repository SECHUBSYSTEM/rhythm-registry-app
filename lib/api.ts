import axios, { type AxiosError } from "axios";
import { createClient } from "@/lib/supabase/client";

const api = axios.create({
  baseURL: typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  async (config) => {
    if (typeof window === "undefined") return config;
    const supabase = createClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
      return config;
    } catch (err) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore signOut errors
      }
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = next ? `/login?next=${next}` : "/login";
      return Promise.reject(err);
    }
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const supabase = createClient();
      supabase.auth.signOut();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
