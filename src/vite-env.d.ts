/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string; // 例如 http://localhost:8080
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
