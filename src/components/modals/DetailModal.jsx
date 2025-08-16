import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Bookmark, MessageCircle, Star } from "lucide-react";
import Chip from "../ui/Chip";
import OriChip from "../ui/OriChip";
import { THEME } from "../../lib/theme";
import { heatScore } from "../../lib/utils";
import SafeExternal from "../../components/SafeExternal";

// 新增：对接后端 & 全局（修正命名：bookApi）
import { bookApi } from "../../api/sdk";
import { useAppStore } from "../../store/AppStore";

// 详情弹窗
export default function DetailModal({ open, onClose, item }) {
  const [fold, setFold] = useState(true);
  const { user, setCommentsOpen } = useAppStore(); // 仅用于拿 userId 和打开评论抽屉
  if (!item) return null;

  const userId = user?.id || 1; // 兜底

  const onLike = async () => {
    try {
      await bookApi.like(item.id, userId);
      // 不改变你的 UI：此处不强制刷新，交由外层列表刷或二次进入可见
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

  const onComment = () => {
    setCommentsOpen?.({ open: true, item });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          style={{ background: "rgba(20,16,21,0.35)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-1/2 -translate-x-1/2 top-10 w-[95%] md:w-[720px] rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #FFF7FA 100%)",
              boxShadow: THEME.shadowHover,
              border: `1px solid ${THEME.border}`,
            }}
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            <div className="p-5">
              <div className="flex items-center gap-2">
                <OriChip value={item.orientation} />
                <Chip bg="#FFF" text="#6B7280">{item.category}</Chip>
                <div className="text-xl font-bold ml-1">{item.title}</div>
                <div className="ml-auto text-xs text-gray-600 flex items-center gap-1">
                  <Star className="w-4 h-4" style={{ color: "#F59E0B" }} />
                  热度 {heatScore(item)}
                </div>
              </div>

              <div className="mt-1 text-gray-600">作者：{item.author}</div>

              <div className="mt-2 flex flex-wrap gap-2">
                {item.tags.map((t) => (
                  <Chip key={t} color="#E9D5FF" text="#6D28D9" bg="#F6F3FF">
                    {t}
                  </Chip>
                ))}
              </div>

              <div className="mt-4 text-[15px] leading-relaxed">
                <div className="font-semibold mb-1">推荐语</div>
                {item.blurb}
              </div>

              <div className="mt-4 text-[15px] leading-relaxed">
                <div className="font-semibold mb-1">简介</div>
                {fold ? item.summary || "暂无简介" : item.summary + "\n"}
                {item.summary && item.summary.length > 120 && (
                  <button
                    onClick={() => setFold((v) => !v)}
                    className="inline-flex items-center gap-1 ml-1"
                    style={{ color: "#8B7CF6" }}
                  >
                    {fold ? "展开" : "收起"}
                  </button>
                )}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <button
                  className="px-3 py-2 rounded-full border"
                  style={{ borderColor: THEME.border }}
                  onClick={onLike}
                >
                  <Heart className="w-4 h-4" /> 点赞
                </button>
                <button
                  className="px-3 py-2 rounded-full border"
                  style={{ borderColor: THEME.border }}
                  onClick={onBookmark}
                >
                  <Bookmark className="w-4 h-4" /> 收藏
                </button>
                <button
                  className="px-3 py-2 rounded-full border"
                  style={{ borderColor: THEME.border }}
                  onClick={onComment}
                >
                  <MessageCircle className="w-4 h-4" /> 评论
                </button>
              </div>

              <div className="mt-4">
                <SafeExternal href="https://example.com/book/123">
                  前往外部书源
                </SafeExternal>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
