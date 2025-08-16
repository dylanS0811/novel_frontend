// src/components/ui/SidebarList.jsx
import React from "react";
import { classNames } from "../../lib/utils";

/**
 * 竖排小卡样式的列表（书单用）
 * items: [{ id, title, subtitle, badge, active, onClick, onEdit, onDelete }]
 */
export default function SidebarList({ items = [], emptyHint = "暂无数据" }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-[#F1E6EB] bg-white/60 p-6 text-center text-sm text-gray-500">
        {emptyHint}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div
          key={it.id}
          className={classNames(
            "group cursor-pointer rounded-2xl border bg-white/70 px-4 py-3 transition",
            "border-[#F1E6EB] hover:shadow-sm",
            it.active ? "ring-2 ring-pink-200" : ""
          )}
          onClick={it.onClick}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-gray-800">
                {it.title}
              </div>
              {it.subtitle && (
                <div className="truncate text-xs text-gray-500 mt-0.5">
                  {it.subtitle}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {it.badge && (
                <span className="rounded-full bg-pink-50 text-pink-600 text-xs px-2 py-0.5">
                  {it.badge}
                </span>
              )}
              {/* 悬浮时出现的小操作 */}
              <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    it.onEdit?.();
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                  title="重命名"
                >
                  改
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    it.onDelete?.();
                  }}
                  className="text-xs text-gray-400 hover:text-red-500"
                  title="删除"
                >
                  删
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
