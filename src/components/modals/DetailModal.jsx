import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Bookmark,
  MessageCircle,
  Star,
  X,
  Quote,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import Chip from "../ui/Chip";
import OriChip from "../ui/OriChip";
import { THEME } from "../../lib/theme";
import { heatScore } from "../../lib/utils";
import SafeExternal from "../../components/SafeExternal";

// 后端 API
import { bookApi } from "../../api/sdk";
import { useAppStore } from "../../store/AppStore";

/**
 * 详情弹窗（UI + 交互）
 * - 点击对话框外 / Esc 关闭
 * - 遮罩不拦截点击（pointer-events: none），页面可继续操作
 * - 修复：所有 hooks 顶层无条件调用，避免“Rendered more hooks than during the previous render”
 */
export default function DetailModal({ open, onClose, item }) {
  const [fold, setFold] = useState(true);
  const { user, setCommentsOpen } = useAppStore(); // 仅用于拿 userId 和打开评论抽屉
  const cardRef = useRef(null);

  // Esc + 点击外部关闭（hooks 必须始终调用，不要放在条件 return 之后）
  useEffect(() => {
    if (!open || !item) return; // 只在打开且有数据时生效
    const onKey = (e) => e.key === "Escape" && onClose?.();
    const onDown = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    // 捕获阶段，确保先于内部阻止
    document.addEventListener("mousedown", onDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown, true);
    };
  }, [open, onClose, item]);

  // ===== 这里再做条件渲染（不会影响 hooks 顺序）=====
  if (!open || !item) return null;

  const userId = user?.id || 1; // 兜底
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const needFold = (item.summary || "").length > 160;

  const onLike = async () => {
    try {
      await bookApi.like(item.id, userId);
    } catch (e) {
      console.error("like failed", e);
    }
  };
  const onBookmark = async () => {
    try {
      await bookApi.bookmark(item.id, userId);
    } catch (e) {
      console.error("bookmark failed", e);
    }
  };
  const onComment = () => setCommentsOpen?.({ open: true, item });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 视觉遮罩：不拦截点击 */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(20,16,21,0.35)" }}
          />

          {/* 内容卡片：可交互 */}
          <motion.div
            ref={cardRef}
            className="absolute left-1/2 -translate-x-1/2 top-8 w-[94%] md:w-[780px] pointer-events-auto rounded-3xl overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, #FFFFFF 0%, #FFF7FA 55%, #FFF5F8 100%)",
              border: `1px solid ${THEME.border}`,
              boxShadow:
                "0 20px 52px rgba(248,108,139,0.22), 0 1px 0 rgba(255,255,255,0.9) inset",
            }}
            initial={{ scale: 0.96, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 14, opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={item.title || "书籍详情"}
          >
            {/* 顶部装饰带 */}
            <div
              className="h-16 relative"
              style={{
                background: `linear-gradient(90deg, ${THEME.bgFrom}, ${THEME.bgTo})`,
              }}
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 h-9 w-9 rounded-full grid place-items-center bg-white/90 border hover:bg-white"
                style={{ borderColor: THEME.border }}
                aria-label="关闭"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <div className="absolute left-5 bottom-4 flex items-center gap-2">
                <OriChip value={item.orientation} />
                {item.category && (
                  <Chip bg="#FFF" text="#6B7280">{item.category}</Chip>
                )}
              </div>
            </div>

            {/* 主体内容 */}
            <div className="p-5 md:p-6">
              {/* 标题区 */}
              <div className="flex items-start gap-3">
                <div className="min-w-0">
                  <div className="text-xl md:text-2xl font-semibold text-gray-900 truncate">
                    {item.title}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    作者：{item.author}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1 text-sm text-amber-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  热度 {heatScore(item)}
                </div>
              </div>

              {/* 标签 */}
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <Chip key={t} color="#E9D5FF" text="#6D28D9" bg="#F6F3FF">
                      {t}
                    </Chip>
                  ))}
                </div>
              )}

              {/* 推荐语 */}
              {item.blurb && (
                <div
                  className="mt-5 rounded-2xl border bg-white p-4 relative"
                  style={{ borderColor: THEME.border }}
                >
                  <div
                    className="absolute -top-2 -left-2 h-6 w-6 rounded-xl grid place-items-center bg-rose-50 border"
                    style={{ borderColor: THEME.border }}
                  >
                    <Quote className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="text-[15px] leading-relaxed text-gray-800">
                    {item.blurb}
                  </div>
                </div>
              )}

              {/* 简介 */}
              <div
                className="mt-5 rounded-2xl border bg-white p-4 relative"
                style={{ borderColor: THEME.border }}
              >
                <div className="text-sm font-medium text-gray-700 mb-1">简介</div>
                <div className="relative">
                  <div
                    className={needFold && fold ? "max-h-24 overflow-hidden" : ""}
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {item.summary || "暂无简介"}
                  </div>
                  {needFold && (
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => setFold((v) => !v)}
                        className="text-xs px-2 py-1 rounded-full border bg-white hover:bg-rose-50 transition"
                        style={{ borderColor: THEME.border, color: "#8B7CF6" }}
                      >
                        {fold ? "展开" : "收起"}
                      </button>
                    </div>
                  )}
                  {needFold && fold && (
                    <div
                      className="pointer-events-none absolute bottom-8 left-0 right-0 h-10"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0), #FFFFFF)",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* 行为按钮 */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  className="h-11 rounded-full border bg-white flex items-center justify-center gap-2 text-gray-700 hover:shadow-md transition"
                  style={{ borderColor: THEME.border }}
                  onClick={onLike}
                >
                  <Heart className="w-4 h-4" />
                  点赞
                </button>
                <button
                  className="h-11 rounded-full border bg-white flex items-center justify-center gap-2 text-gray-700 hover:shadow-md transition"
                  style={{ borderColor: THEME.border }}
                  onClick={onBookmark}
                >
                  <Bookmark className="w-4 h-4" />
                  收藏
                </button>
                <button
                  className="h-11 rounded-full border bg-white flex items-center justify-center gap-2 text-gray-700 hover:shadow-md transition"
                  style={{ borderColor: THEME.border }}
                  onClick={onComment}
                >
                  <MessageCircle className="w-4 h-4" />
                  评论
                </button>
              </div>

              {/* 外部链接 */}
              <div className="mt-5">
                <SafeExternal href="https://example.com/book/123">
                  <span className="inline-flex items-center gap-1 text-rose-600 hover:underline">
                    <ExternalLink className="w-4 h-4" />
                    前往外部书源
                  </span>
                </SafeExternal>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
