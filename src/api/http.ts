// src/api/http.ts
import axios from "axios";

const http = axios.create({
  baseURL: "",
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => {
    const d = res.data;
    if (d && typeof d === "object" && "code" in d && "message" in d) {
      if (d.code === 0) return { ...res, data: d.data };
      const err: any = new Error(d.message || "请求失败");
      err.code = d.code;
      throw err;
    }
    return res;
  },
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(err);
  }
);

export default http;
