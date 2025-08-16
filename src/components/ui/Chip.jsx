import React from "react";
import { THEME } from "../../lib/theme";

// 通用小圆角标签
export default function Chip({ children, color = THEME.border, text = "#6B7280", bg = "#FFF" }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full border" style={{ borderColor: color, color: text, background: bg }}>
      {children}
    </span>
  );
}
