import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Tag, Calendar, Quote } from "lucide-react";
import { THEME } from "../../lib/theme";
import { classNames, formatDate } from "../../lib/utils";

/**
 * SheetBookDetailModal（纯 UI）
 * 受控用法：
 *   <SheetBookDetailModal open={open} book={book} onClose={() => setOpen(false)} />
 * - 点击遮罩/对话框外部可关闭
 * - 按下 Esc 可关闭
 */
export default function SheetBookDetailModal({ open, book, onClose }) {
  const stars = Math.max(0, Math.min(5, Math.round((book?.rating || 0) / 2)));

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 点击遮罩关闭（确保只在点击遮罩本身时触发）
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 背景遮罩（点击即可关闭） */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={handleOverlayClick}
            onClick={handleOverlayClick}
          />

          {/* 内容卡片 */}
          <motion.div
            className="fixed z-[70] inset-0 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.18 }}
            // 让辅助技术识别为对话框
            role="dialog"
            aria-modal="true"
            aria-label={book?.title || "书籍详情"}
          >
            <div className="w-full max-w-[720px] bg-white rounded-3xl border border-[#F1E6EB] shadow-[0_20px_48px_rgba(248,108,139,0.18)] overflow-hidden">
              {/* 顶部渐变 */}
              <div
                className="h-20 relative"
                style={{
                  background: `linear-gradient(90deg, ${THEME.bgFrom}, ${THEME.bgTo})`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-80"
                  style={{
                    background: `radial-gradient(1200px 240px at 10% 0%, ${THEME.rose}10, transparent), radial-gradient(1200px 240px at 90% 0%, ${THEME.orchid}10, transparent)`,
                  }}
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 h-8 w-8 rounded-full flex items-center justify-center bg-white/80 border border-[#F1E6EB] hover:bg-white"
                  aria-label="关闭"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
                <div className="absolute left-6 bottom-4 flex items-center gap-3">
                  <div
                    className="h-12 w-12 flex items-center justify-center rounded-2xl text-white text-base font-bold shadow"
                    style={{
                      background: `linear-gradient(135deg, ${THEME.rose}, ${THEME.orchid})`,
                    }}
                  >
                    {(book?.title || "书")[0]}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-800">
                      {book?.title || "未命名"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {book?.author ? `作者：${book.author}` : "作者未填"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 内容 */}
              <div className="p-6">
                {/* 评分 + 标签 */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={classNames(
                          "h-5 w-5",
                          i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        )}
                      />
                    ))}
                    <span className="text-sm text-gray-500 ml-1">
                      {typeof book?.rating === "number" ? `${book.rating}/10` : "未评分"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                  {book?.orientation && (
                      <span className="px-2.5 py-1 rounded-full bg-pink-50 text-pink-600 text-xs border border-pink-100">
                        <Tag className="inline -mt-[3px] mr-1 h-4 w-4" />
                        {book.orientation}
                      </span>
                    )}
                    {book?.category && (
                      <span className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 text-xs border border-violet-100">
                        <Tag className="inline -mt-[3px] mr-1 h-4 w-4" />
                        {book.category}
                      </span>
                    )}
                  </div>
                </div>

                {Array.isArray(book?.tags) && book.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {book.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 text-xs border border-gray-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 一句话推荐 */}
                {book?.review && (
                  <div className="mt-5 rounded-2xl border border-[#F7E3EA] bg-[#FFF6F8] p-5 relative">
                    <Quote className="h-5 w-5 text-pink-400 absolute -top-3 -left-3 rotate-12" />
                    <div className="text-sm text-gray-700 leading-6">{book.review}</div>
                  </div>
                )}

                {book?.summary && (
                  <div className="mt-5 rounded-2xl border border-[#F7E3EA] bg-[#FFF6F8] p-5">
                    <div className="text-sm text-gray-700 leading-6 whitespace-pre-wrap">
                      {book.summary}
                    </div>
                  </div>
                )}

                {/* 元信息 */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    创建时间：{book?.createdAt ? formatDate(book.createdAt) : "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    最近更新：{book?.updatedAt ? formatDate(book.updatedAt) : "—"}
                  </div>
                </div>

                {/* 底部操作（占位） */}
                <div className="mt-6 flex items-center justify-end gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm rounded-full border border-[#F1E6EB] text-gray-700 hover:bg-gray-50"
                  >
                    关闭
                  </button>
                  <button
                    className="px-4 py-2 text-sm rounded-full text-white shadow"
                    style={{
                      background: `linear-gradient(135deg, ${THEME.rose}, ${THEME.orchid})`,
                    }}
                  >
                    去详情页（占位）
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
