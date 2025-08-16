// src/components/ui/BookListRow.jsx
import React from "react";
import { classNames } from "../../lib/utils";

/**
 * 右侧书籍“行式列表”的单行
 * props:
 *  - book: { title, author, orientation, category, rating, reason/intro/tags ... }
 *  - onEdit, onDelete
 */
export default function BookListRow({ book = {}, onEdit, onDelete }) {
  const title = book.title || book.name || "未命名书籍";
  const author = book.author || "未知作者";
  const orientation = book.orientation || book.sexuality || "";
  const category = book.category || book.type || "";
  const rating =
    typeof book.rating === "number"
      ? book.rating
      : typeof book.score === "number"
      ? book.score
      : "";

  // 兼容不同字段名：一句话推荐/简介
  const oneLine =
    book.oneLine ||
    book.reason ||
    book.brief ||
    book.blurb ||
    book.summary ||
    "";

  // 可选标签数组
  const tags = Array.isArray(book.tags) ? book.tags : [];

  return (
    <div className="flex items-start gap-4 px-4 py-3 bg-white/70">
      {/* 左侧：占位封面/首字母（如果无封面就给个优雅占位） */}
      <div className="w-10 h-14 rounded-lg bg-pink-50 text-pink-400 flex items-center justify-center shrink-0 select-none">
        <span className="text-base">{String(title).charAt(0)}</span>
      </div>

      {/* 中间：主要信息 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="truncate font-medium text-gray-900">{title}</div>
          <div className="truncate text-xs text-gray-500">/ {author}</div>
          {rating !== "" && (
            <span className="ml-2 text-xs rounded-full bg-pink-50 text-pink-600 px-2 py-0.5">
              ⭐ {rating}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          {orientation && (
            <span className="rounded-full bg-gray-50 px-2 py-0.5">{orientation}</span>
          )}
          {category && (
            <span className="rounded-full bg-gray-50 px-2 py-0.5">{category}</span>
          )}
          {tags.slice(0, 4).map((t, idx) => (
            <span key={idx} className="rounded-full bg-gray-50 px-2 py-0.5">
              {t}
            </span>
          ))}
        </div>

        {oneLine && (
          <div className="mt-1 text-sm text-gray-700 line-clamp-2">{oneLine}</div>
        )}
      </div>

      {/* 右侧：操作 */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onEdit}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          编辑
        </button>
        <button
          onClick={onDelete}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          删除
        </button>
      </div>
    </div>
  );
}
