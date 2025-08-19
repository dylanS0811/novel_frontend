// src/components/modals/NotificationsDrawer.jsx
import React, { useMemo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { THEME } from "../../lib/theme";
import { classNames } from "../../lib/utils";
import { useAppStore } from "../../store/AppStore";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Bookmark,
  AtSign,
  Trophy,
  Info,
  Trash2,
  CheckCheck,
  X,
} from "lucide-react";

/* -------------------- 类型元信息（保留原语义） -------------------- */
const TYPE_META = {
  like: { label: "点赞", icon: Heart },
  comment: { label: "评论", icon: MessageCircle },
  bookmark: { label: "收藏", icon: Bookmark },
  mention: { label: "提及", icon: AtSign },
  achievement: { label: "成就", icon: Trophy },
  system: { label: "系统", icon: Info },
  reply: { label: "评论", icon: MessageCircle },
  comment_like: { label: "点赞", icon: Heart },
};

/** 为不同通知类型提供静态 Tailwind 配色（避免动态类名失效） */
const TYPE_STYLE = {
  like: {
    chip: "bg-rose-50 text-rose-600 border-rose-100",
    icon: "bg-rose-50 text-rose-600",
    ring: "ring-rose-100",
    leftBar: "before:bg-rose-200",
  },
  comment: {
    chip: "bg-indigo-50 text-indigo-600 border-indigo-100",
    icon: "bg-indigo-50 text-indigo-600",
    ring: "ring-indigo-100",
    leftBar: "before:bg-indigo-200",
  },
  bookmark: {
    chip: "bg-violet-50 text-violet-600 border-violet-100",
    icon: "bg-violet-50 text-violet-600",
    ring: "ring-violet-100",
    leftBar: "before:bg-violet-200",
  },
  mention: {
    chip: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
    icon: "bg-fuchsia-50 text-fuchsia-600",
    ring: "ring-fuchsia-100",
    leftBar: "before:bg-fuchsia-200",
  },
  achievement: {
    chip: "bg-amber-50 text-amber-700 border-amber-100",
    icon: "bg-amber-50 text-amber-700",
    ring: "ring-amber-100",
    leftBar: "before:bg-amber-200",
  },
  system: {
    chip: "bg-gray-50 text-gray-600 border-gray-200",
    icon: "bg-gray-50 text-gray-600",
    ring: "ring-gray-100",
    leftBar: "before:bg-gray-200",
  },
};

/* 头像缺失时的小气泡图标 */
function IconBubble({ type = "system", read = false }) {
  const style =
    TYPE_STYLE[type] ||
    TYPE_STYLE[
      type === "reply" ? "comment" : type === "comment_like" ? "like" : "system"
    ];
  const Icon = TYPE_META[type]?.icon || UserPlus;

  return (
    <div
      className={classNames(
        "relative w-9 h-9 rounded-full flex items-center justify-center border",
        style.icon,
        read ? "border-gray-200" : "border-transparent ring-4 " + style.ring
      )}
      title={TYPE_META[type]?.label || type}
    >
      {!read && (
        <>
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-40"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
        </>
      )}
      <Icon className="w-[18px] h-[18px]" />
    </div>
  );
}

export default function NotificationsDrawer({ open, onClose }) {
  const {
    notifications,
    markNotificationRead,
    markAllRead,
    clearNotifications,
    items,
    setDetail,
    setCommentsOpen,
  } = useAppStore();

  const [filter, setFilter] = useState("all");
  const drawerRef = useRef(null);

  // Esc 关闭 + 点击抽屉外关闭（允许点穿遮罩）
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    const onDown = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose]);

  const doMarkAllRead = async () => {
    await markAllRead();
  };

  const filters = [
    { label: "全部", value: "all", icon: Bell },
    { label: "评论", value: "comment", icon: MessageCircle },
    { label: "点赞", value: "like", icon: Heart },
    { label: "收藏", value: "bookmark", icon: Bookmark },
    { label: "提及", value: "mention", icon: AtSign },
    { label: "系统", value: "system", icon: Info },
    { label: "成就", value: "achievement", icon: Trophy },
  ];

  const available = new Set(
    notifications.map((n) => {
      if (n.type === "reply") return "comment";
      if (n.type === "comment_like") return "like";
      return n.type;
    })
  );

  const filtered = notifications.filter(
    (n) =>
      filter === "all" ||
      n.type === filter ||
      (filter === "comment" && n.type === "reply") ||
      (filter === "like" && n.type === "comment_like")
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const timeAgo = (ts) => {
    const d = new Date(ts).getTime();
    const diff = Date.now() - d;
    if (Number.isNaN(d)) return "";
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}秒前`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}分钟前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}小时前`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}天前`;
    return new Date(ts).toLocaleDateString();
  };

  const renderText = (n) => {
    const who =
      n.actor?.nick ||
      n.actor?.nickname ||
      n.actor?.name ||
      "有人";
    const book = n.bookTitle || "作品";
    const excerpt = n.content || "";
    switch (n.type) {
      case "like":
        return (
          <>
            <b>{who}</b> 点赞了你推荐的 <b>{book}</b>
          </>
        );
      case "comment":
        return (
          <>
            <b>{who}</b> 评论了你推荐的 <b>{book}</b>：{excerpt}
          </>
        );
      case "bookmark":
        return (
          <>
            <b>{who}</b> 收藏了你推荐的 <b>{book}</b>
          </>
        );
      case "reply":
        return (
          <>
            <b>{who}</b> 回复了你的评论：{excerpt}
          </>
        );
      case "comment_like":
        return (
          <>
            <b>{who}</b> 赞了你的评论：{excerpt}
          </>
        );
      case "mention":
        return (
          <>
            <b>{who}</b> 在评论中提到了你：{excerpt}
          </>
        );
      case "achievement":
        return (
          <>
            你的推荐 <b>{book}</b> 上榜「{n.title}」
          </>
        );
      case "system":
        return <>{n.title}</>;
      default:
        return <>{n.title}</>;
    }
  };

  const openTarget = async (n) => {
    await markNotificationRead(n.id);
    onClose();
    if (n.bookId) {
      const book = items.find((b) => b.id === n.bookId);
      if (book) {
        setDetail(book);
        if (n.commentId) setCommentsOpen({ open: true, item: book });
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 视觉遮罩：仅展示，不拦截点击 */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(20,16,21,0.28)" }}
          />

          {/* 右侧抽屉：可交互 */}
          <motion.div
            ref={drawerRef}
            className="absolute right-0 top-0 bottom-0 w-[92vw] max-w-md p-4 pointer-events-auto"
            style={{
              background:
                "linear-gradient(180deg, #FFFFFF 0%, #FFF7FA 35%, #FFF5F8 100%)",
              borderLeft: `1px solid ${THEME.border}`,
              boxShadow:
                "0 16px 40px rgba(248,108,139,0.18), 0 2px 0 rgba(255,255,255,0.8) inset",
            }}
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            role="dialog"
            aria-label="通知中心"
            aria-modal="true"
          >
            {/* 顶部：标题与动作 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-9 w-9 rounded-2xl grid place-items-center"
                  style={{
                    background: `linear-gradient(135deg, ${THEME.rose}22, ${THEME.orchid}22)`,
                    border: `1px solid ${THEME.border}`,
                  }}
                >
                  <Bell className="w-5 h-5" style={{ color: THEME.rose }} />
                </div>
                <div className="font-semibold text-gray-800">通知中心</div>
                <span className="ml-1 text-xs text-gray-500">
                  {unreadCount > 0 ? `未读 ${unreadCount}` : "已全部阅读"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={doMarkAllRead}
                  className="px-3 h-8 text-xs rounded-full border bg-white hover:bg-rose-50 transition"
                  style={{ borderColor: THEME.border }}
                  title="全部已读"
                >
                  <CheckCheck className="w-4 h-4 inline mr-1 -mt-0.5" />
                  全部已读
                </button>
                <button
                  onClick={clearNotifications}
                  className="px-3 h-8 text-xs rounded-full border bg-white hover:bg-gray-50 transition"
                  style={{ borderColor: THEME.border }}
                  title="清空"
                >
                  <Trash2 className="w-4 h-4 inline mr-1 -mt-0.5" />
                  清空
                </button>
                <button
                  onClick={onClose}
                  title="关闭"
                  className="h-8 w-8 rounded-full grid place-items-center border bg-white hover:bg-gray-50"
                  style={{ borderColor: THEME.border }}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* 筛选胶囊 */}
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.map((f) => {
                const FIcon = f.icon;
                const disabled = f.value !== "all" && !available.has(f.value);
                const active = filter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    disabled={disabled}
                    className={classNames(
                      "h-8 px-3 rounded-full border text-sm inline-flex items-center gap-1.5 transition",
                      active
                        ? "bg-rose-50 text-rose-600"
                        : "bg-white text-gray-600 hover:bg-gray-50",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                    style={{ borderColor: THEME.border }}
                  >
                    <FIcon className="w-4 h-4" />
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* 列表 */}
            <div className="mt-4 space-y-2 overflow-auto h-[calc(100%-170px)] pr-1">
              {filtered.length === 0 && (
                <div className="mt-14 text-center">
                  <div
                    className="mx-auto h-14 w-14 rounded-2xl grid place-items-center border"
                    style={{ borderColor: THEME.border, background: "#fff" }}
                  >
                    <Bell className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="mt-3 text-sm text-gray-500">暂无通知</div>
                </div>
              )}

              {filtered.map((n) => {
                const typeKey =
                  n.type === "reply"
                    ? "comment"
                    : n.type === "comment_like"
                    ? "like"
                    : n.type;
                const tStyle = TYPE_STYLE[typeKey] || TYPE_STYLE.system;
                const TypeIcon = TYPE_META[n.type]?.icon;

                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    onClick={() => openTarget(n)}
                    className={classNames(
                      "relative rounded-2xl border p-3 bg-white/90 flex items-start gap-3 cursor-pointer group overflow-hidden",
                      "before:absolute before:inset-y-0 before:left-0 before:w-1 before:opacity-70",
                      tStyle.leftBar
                    )}
                    style={{ borderColor: THEME.border }}
                  >
                    {/* 左侧头像/图标 */}
                    {n.actor?.avatar ? (
                      <div className="relative">
                        <img
                          src={n.actor.avatar}
                          alt={
                            n.actor?.nick ||
                            n.actor?.nickname ||
                            n.actor?.name ||
                            "avatar"
                          }
                          className={classNames(
                            "w-9 h-9 rounded-full object-cover border",
                            n.read ? "border-gray-200" : "border-rose-200"
                          )}
                        />
                        {!n.read && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring ring-white"></span>
                        )}
                      </div>
                    ) : (
                      <IconBubble type={n.type} read={n.read} />
                    )}

                    {/* 文本区 */}
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={classNames(
                            "px-2 py-0.5 rounded-full border bg-white shadow-sm flex items-center gap-1 text-[11px]",
                            TYPE_STYLE[typeKey]?.chip
                          )}
                        >
                          {TypeIcon ? <TypeIcon className="w-3.5 h-3.5" /> : null}
                          {TYPE_META[n.type]?.label || n.type}
                        </span>

                        <div className="text-gray-800 leading-5 truncate">
                          {renderText(n)}
                        </div>
                      </div>

                      <div className="text-gray-400 text-[11px] mt-1">
                        {timeAgo(n.createdAt)}
                        {!n.read && <span className="ml-2 text-rose-500">未读</span>}
                      </div>
                    </div>

                    {/* 快速标记已读 */}
                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationRead(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-gray-600"
                        title="标记已读"
                      >
                        <CheckCheck className="w-[18px] h-[18px]" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
