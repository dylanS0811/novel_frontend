// src/components/SafeExternal.jsx
import React from "react";
import { THEME } from "../lib/theme";

/** 安全外链组件：统一处理外链跳转/统计样式 */
export default function SafeExternal({ href, children }) {
  const safe = `/out?url=${encodeURIComponent(href)}`;
  return (
    <a
      className="inline-flex items-center gap-1 underline"
      style={{ color: THEME.orchid }}
      href={safe}
    >
      {children}
    </a>
  );
}
