// src/components/ui/EmptyState.jsx
import React from "react";

export default function EmptyState({ hint = "暂无内容" }) {
  return (
    <div className="rounded-2xl border border-[#F1E6EB] bg-white/60 p-10 text-center text-sm text-gray-500">
      {hint}
    </div>
  );
}
