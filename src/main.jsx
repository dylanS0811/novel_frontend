// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import "./index.css";

// 关键：用命名空间导入，自动兼容不同导出名
import * as AppStore from "./store/AppStore";
// 优先使用 AppProvider，其次 AppStoreProvider；都没有就用 Fragment 兜底
let StoreProvider = AppStore.AppProvider;
if (!StoreProvider && "AppStoreProvider" in AppStore) {
  StoreProvider = AppStore["AppStoreProvider"];
}
if (!StoreProvider) StoreProvider = React.Fragment;

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={qc}>
        <StoreProvider>
          <App />
        </StoreProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
