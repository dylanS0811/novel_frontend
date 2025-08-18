import React from "react";
import { THEME } from "../lib/theme";

export default function Pagination({ page, size, total, onChange }) {
  const pages = Math.ceil(total / size);
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1);
  return (
    <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1.5 rounded-full border text-sm"
        style={{
          borderColor: THEME.border,
          background: THEME.surface,
          opacity: page === 1 ? 0.5 : 1,
        }}
      >
        上一页
      </button>
      {nums.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="px-3 py-1.5 rounded-full border text-sm"
          style={{
            borderColor: THEME.border,
            background: n === page ? THEME.rose : THEME.surface,
            color: n === page ? "#fff" : "#374151",
          }}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 rounded-full border text-sm"
        style={{
          borderColor: THEME.border,
          background: THEME.surface,
          opacity: page === pages ? 0.5 : 1,
        }}
      >
        下一页
      </button>
    </div>
  );
}
