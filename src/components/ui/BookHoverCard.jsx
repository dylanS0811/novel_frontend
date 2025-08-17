import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Tag, Calendar, Quote } from "lucide-react";
import { THEME } from "../../lib/theme";
import { classNames, formatDate } from "../../lib/utils";

/**
 * BookHoverCard（纯 UI）
 * 用法：
 *   <BookHoverCard book={book} onView={() => setOpen(true)}>
 *     <button className="text-pink-500 hover:underline">{book.title}</button>
 *   </BookHoverCard>
 */
export default function BookHoverCard({
  book,
  onView,
  children,
  align = "right", // 'left' | 'right'
  openDelay = 120,
  closeDelay = 120,
}) {
  const [open, setOpen] = useState(false);
  const enterTimer = useRef(null);
  const leaveTimer = useRef(null);
  const stars = Math.max(0, Math.min(5, Math.round((book?.rating || 0) / 2)));

  const handleEnter = () => {
    clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(() => setOpen(true), openDelay);
  };
  const handleLeave = () => {
    clearTimeout(enterTimer.current);
    leaveTimer.current = setTimeout(() => setOpen(false), closeDelay);
  };

  useEffect(() => {
    return () => {
      clearTimeout(enterTimer.current);
      clearTimeout(leaveTimer.current);
    };
  }, []);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={classNames(
              "absolute z-50 w-[360px] max-w-[80vw] rounded-2xl border bg-white",
              "shadow-[0_16px_36px_rgba(248,108,139,0.15)]",
              "border-[#F1E6EB] overflow-hidden",
              align === "left" ? "right-0" : "left-0",
              "top-[calc(100%+10px)]"
            )}
          >
            {/* 顶部渐变条 */}
            <div
              className="h-2 w-full"
              style={{
                background: `linear-gradient(90deg, ${THEME.rose}, ${THEME.orchid})`,
              }}
            />

            <div className="p-4">
              {/* 标题区 */}
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 flex items-center justify-center rounded-xl text-white text-sm font-bold shadow"
                  style={{
                    background: `linear-gradient(135deg, ${THEME.rose}, ${THEME.orchid})`,
                  }}
                >
                  {(book?.title || "书")[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">
                    {book?.title || "未命名"}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {book?.author ? `作者：${book.author}` : "作者未填"}
                  </div>
                </div>
              </div>

              {/* 标签/评分 */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                {book?.orientation && (
                  <span className="px-2 py-[2px] rounded-full bg-pink-50 text-pink-500 border border-pink-100">
                    <Tag className="inline-block -mt-[2px] mr-1 h-3 w-3" />
                    {book.orientation}
                  </span>
                )}
                {book?.category && (
                  <span className="px-2 py-[2px] rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                    <Tag className="inline-block -mt-[2px] mr-1 h-3 w-3" />
                    {book.category}
                  </span>
                )}
                {typeof book?.rating === "number" && (
                  <span className="ml-auto flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={classNames(
                          "h-4 w-4",
                          i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        )}
                      />
                    ))}
                    <span className="text-[11px] text-gray-500 ml-1">
                      {book.rating}/10
                    </span>
                  </span>
                )}
              </div>

              {/* 一句话推荐 */}
              {book?.review && (
                <div className="mt-3 bg-[#FFF6F8] border border-[#F7E3EA] rounded-xl p-3 relative">
                  <Quote className="h-4 w-4 text-pink-400 absolute -top-2 -left-2 rotate-12" />
                  <div className="text-xs text-gray-700 max-h-16 overflow-hidden">
                    {book.review}
                  </div>
                </div>
              )}

              {/* 元信息 */}
              <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>创建：{book?.createdAt ? formatDate(book.createdAt) : "—"}</span>
                <span className="mx-1">·</span>
                <span>更新：{book?.updatedAt ? formatDate(book.updatedAt) : "—"}</span>
              </div>

              {/* 操作 */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-[11px] text-gray-400">悬停查看预览</div>
                <button
                  onClick={onView}
                  className="text-xs px-3 py-1.5 rounded-full text-white shadow"
                  style={{
                    background: `linear-gradient(135deg, ${THEME.rose}, ${THEME.orchid})`,
                  }}
                >
                  查看详情
                </button>
              </div>
            </div>

            {/* 气泡三角 */}
            <div
              className={classNames(
                "absolute -top-2 h-4 w-4 rotate-45 rounded-[4px] border border-[#F1E6EB] bg-white",
                align === "left" ? "right-6" : "left-6"
              )}
              style={{ boxShadow: "0 6px 20px rgba(248,108,139,0.12)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
