// src/components/modals/NotificationsDrawer.jsx
import React, { useEffect, useState } from "react";
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

// 新增：对接后端（修正命名：notificationApi）
import { notificationApi } from "../../api/sdk";

function ItemIcon({ type }) {
  if (type === "like" || type === "comment_like")
    return <Heart className="w-4 h-4" />;
  if (type === "comment" || type === "reply")
    return <MessageCircle className="w-4 h-4" />;
  if (type === "bookmark") return <Bookmark className="w-4 h-4" />;
  if (type === "mention") return <AtSign className="w-4 h-4" />;
  if (type === "achievement") return <Trophy className="w-4 h-4" />;
  if (type === "system") return <Info className="w-4 h-4" />;
  return <UserPlus className="w-4 h-4" />;
}

export default function NotificationsDrawer({ open, onClose }) {
  const {
    notifications,
    addNotification,
    markNotificationRead,
    markAllRead,
    clearNotifications,
    user,
    items,
    setDetail,
    setCommentsOpen,
  } = useAppStore();

  const [filter, setFilter] = useState("all");

  // 打开时拉取后端通知列表
  useEffect(() => {
    const fetchList = async () => {
      if (!open) return;
      try {
        const userId = user?.id || 1;
        const res = await notificationApi.list({ userId, page: 1, size: 50 });
        const list = res?.data?.list || [];
        clearNotifications();
        list.forEach(addNotification);
      } catch (e) {
        console.error("fetch notifications failed", e);
      }
    };
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const doMarkAllRead = async () => {
    try {
      const userId = user?.id || 1;
      await notificationApi.readAll(userId);
    } catch (e) {
      console.error("mark read-all failed", e);
    }
    markAllRead();
  };

  const filters = [
    { label: "全部", value: "all" },
    { label: "评论", value: "comment" },
    { label: "点赞", value: "like" },
    { label: "收藏", value: "bookmark" },
    { label: "提及", value: "mention" },
    { label: "系统", value: "system" },
    { label: "成就", value: "achievement" },
  ];
  const available = new Set(notifications.map((n) => n.type));
  const filtered = notifications.filter(
    (n) => filter === "all" || n.type === filter
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
    const who = n.actor?.name || "有人";
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
          className="fixed inset-0 z-50"
          style={{ background: "rgba(20,16,21,0.28)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 w-[92vw] max-w-sm p-4 border-l"
            style={{
              background: "linear-gradient(180deg,#FFFFFF,#FFF5F8)",
              borderColor: THEME.border,
            }}
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" style={{ color: THEME.rose }} />
                <div className="font-semibold">通知中心</div>
              </div>
              <button onClick={onClose} title="关闭">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <button
                onClick={doMarkAllRead}
                className="px-2 py-1 rounded-full border bg-white"
                style={{ borderColor: THEME.border }}
                title="全部已读"
              >
                <CheckCheck className="w-4 h-4 inline mr-1" />
                全部已读
              </button>
              <button
                onClick={clearNotifications}
                className="px-2 py-1 rounded-full border bg-white"
                style={{ borderColor: THEME.border }}
                title="清空"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                清空
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  disabled={f.value !== "all" && !available.has(f.value)}
                  className={classNames(
                    "px-2 py-1 rounded-full border",
                    filter === f.value ? "bg-rose-50" : "bg-white"
                  )}
                  style={{
                    borderColor: THEME.border,
                    opacity: f.value !== "all" && !available.has(f.value) ? 0.5 : 1,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2 overflow-auto h-[calc(100%-180px)] pr-1">
              {filtered.length === 0 && (
                <div className="text-sm text-gray-500 mt-10 text-center">
                  暂无通知
                </div>
              )}

              {filtered.map((n) => (
                <div
                  key={n.id}
                  onClick={() => openTarget(n)}
                  className="rounded-xl border p-3 bg-white flex items-start gap-2 cursor-pointer"
                  style={{ borderColor: THEME.border }}
                >
                  {n.actor?.avatar ? (
                    <img
                      src={n.actor.avatar}
                      alt="avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: n.read ? "#F3F4F6" : "#FDF2F8",
                        color: n.read ? "#6B7280" : THEME.rose,
                      }}
                      title={n.type}
                    >
                      <ItemIcon type={n.type} />
                    </div>
                  )}

                  <div className="flex-1 text-sm">
                    <div className="text-gray-800">{renderText(n)}</div>
                    <div className="text-gray-400 text-xs mt-0.5">
                      {timeAgo(n.createdAt)}
                      {!n.read && (
                        <span className="ml-2 text-rose-500">未读</span>
                      )}
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationRead(n.id);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                      title="标记已读"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
