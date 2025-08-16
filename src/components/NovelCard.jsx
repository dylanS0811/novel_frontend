// src/components/NovelCard.jsx
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Bookmark,
  MessageCircle,
  Star,
  BadgeCheck,
  Tag,
  Info,
  X,
} from "lucide-react";

import { THEME } from "../lib/theme";
import { classNames, heatScore, formatDate, asArray } from "../lib/utils";
import Chip from "./ui/Chip";
import OriChip from "./ui/OriChip";

export default function NovelCard({
  item,
  liked,          // ✅ 由父组件传入（当前用户是否已点赞）
  saved,          // ✅ 由父组件传入（当前用户是否已收藏）
  onLike,         // () => void
  onToggleSave,   // () => void
  onOpenDetail,
  onOpenComments,
  onOpenUser,
}) {
  const wrapRef = useRef(null);
  const [showSummary, setShowSummary] = useState(false);

  const [pop, setPop] = useState({
    top: 0,
    left: 0,
    width: 360,
    arrowLeft: 24,
  });

  const tags = asArray(item?.tags);
  const author = item?.author || "佚名";
  const createdAt = formatDate(item?.createdAt);

  // 数量以服务端为准（HomePage 里做乐观数量更新）
  const likes = Number(item?.likes ?? 0);
  const favs = Number(item?.bookmarks ?? 0);
  const cmts = Number(item?.comments ?? 0);

  const openSummary = () => {
    const el = wrapRef.current;
    if (!el) return setShowSummary(true);
    const rect = el.getBoundingClientRect();
    const marginX = 16,
      minTop = 80,
      maxW = 520,
      vw = window.innerWidth;
    const width = Math.min(maxW, vw - marginX * 2);
    let left = Math.min(vw - marginX - width, rect.right - width);
    if (left < marginX) left = marginX;
    let top = Math.max(minTop, rect.top + 8);
    const targetX = rect.right - left - 16;
    let arrowLeft = Math.max(20, Math.min(width - 20, targetX));
    setPop({ top, left, width, arrowLeft });
    setShowSummary(true);
  };

  return (
    <>
      {showSummary && (
        <div
          className="fixed inset-0 z-[30]"
          onClick={() => setShowSummary(false)}
        />
      )}

      <motion.div
        ref={wrapRef}
        layout
        whileHover={{ y: -2 }}
        className="group rounded-2xl overflow-hidden border relative h-full transform-gpu antialiased"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #FFF7FA 100%)",
          borderColor: THEME.border,
          boxShadow: THEME.shadow,
          backfaceVisibility: "hidden",
          transform: "translateZ(0)",
        }}
      >
        <div className="absolute top-3 right-3 flex items-center gap-2 z-[10]">
          <span
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "#F4E8FF",
              color: THEME.orchid,
              border: "1px solid #E9D5FF",
            }}
            title="官方代言推荐"
          >
            <BadgeCheck className="w-4 h-4" />
            代言人
          </span>
          {item?.recommender && (
            <button
              onClick={() => onOpenUser && onOpenUser(item.recommender)}
              className="inline-flex items-center gap-1"
              title="查看推荐人"
            >
              <img
                src={item.recommender.avatar}
                className="w-6 h-6 rounded-full ring-2 ring-white"
                alt="avatar"
              />
              <span className="text-xs text-gray-700">
                {item.recommender.name}
              </span>
            </button>
          )}
        </div>

        <div className="p-4 h-full flex flex-col relative">
          <div className="flex-1">
            <div className="flex items-center gap-2 pr-28">
              <OriChip value={item?.orientation || "其他"} />
              <Chip bg="#FFF" text="#6B7280">
                {item?.category || "其他"}
              </Chip>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              推荐时间：{createdAt}
            </div>

            <div className="mt-1 flex items-center gap-2">
              <button
                onClick={() => onOpenDetail && onOpenDetail(item)}
                className="text-[16px] font-semibold hover:underline"
                title="查看详情"
                style={{ color: "#374151" }}
              >
                {item?.title || "未命名"}
              </button>
              <span className="text-sm text-gray-500">作者：{author}</span>
              <button
                onClick={openSummary}
                className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border"
                style={{
                  borderColor: THEME.border,
                  background: THEME.surface,
                }}
                title="查看简介"
              >
                <Info className="w-3.5 h-3.5" /> 简介
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t, idx) => (
                <Chip
                  key={`${t}-${idx}`}
                  color="#F3E8FF"
                  text="#6D28D9"
                  bg="#F9F5FF"
                >
                  <Tag className="w-3 h-3" /> {t}
                </Chip>
              ))}
            </div>

            <div
              className="mt-3 text-[15px] leading-relaxed text-gray-700 overflow-hidden"
              style={{ minHeight: 48 }}
            >
              {item?.blurb || "——"}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onLike}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border"
              style={{
                borderColor: THEME.border,
                background: liked ? "#FFF1F3" : THEME.surface,
                color: liked ? "#E11D48" : "#374151",
              }}
              title={liked ? "取消点赞" : "点赞"}
            >
              <Heart
                className={classNames("w-4 h-4", liked && "fill-current")}
              />
              <span>{likes}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onToggleSave}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border"
              style={{
                borderColor: THEME.border,
                background: saved ? "#F5F3FF" : THEME.surface,
                color: saved ? "#6D28D9" : "#374151",
              }}
              title={saved ? "取消收藏" : "收藏"}
            >
              <Bookmark
                className={classNames("w-4 h-4", saved && "fill-current")}
              />
              <span>{favs}</span>
            </motion.button>

            <button
              onClick={onOpenComments}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border"
              style={{ borderColor: THEME.border, background: THEME.surface }}
              title="评论"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{cmts}</span>
            </button>

            <div className="ml-auto text-xs text-gray-500 flex items-center gap-1">
              <Star className="w-4 h-4" style={{ color: "#F59E0B" }} />
              热度 {heatScore(item)}
            </div>
          </div>
        </div>
      </motion.div>

      {showSummary && (
        <div
          className="fixed z-[31]"
          style={{ top: pop.top, left: pop.left, width: pop.width }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="rounded-xl border shadow-lg"
            style={{
              borderColor: THEME.border,
              background: "linear-gradient(180deg, #FFFFFF 0%, #FFF7FA 100%)",
            }}
          >
            <div className="flex items-start gap-2 p-3">
              <div className="text-sm leading-relaxed text-gray-800">
                <span className="text-rose-500">简介：</span>
                {item?.summary || "暂无简介~"}
              </div>
              <button
                onClick={() => setShowSummary(false)}
                className="ml-auto p-1 rounded hover:bg-rose-50"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <div
                className="absolute -top-2 w-3 h-3 rotate-45 border-t border-l bg-white"
                style={{ left: pop.arrowLeft, borderColor: THEME.border }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
