/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string; // 例如 http://localhost:8080
  readonly VITE_AVATAR_USE_FILE?: string; // 是否启用文件上传头像
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
