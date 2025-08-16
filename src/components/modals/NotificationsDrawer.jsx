// src/components/modals/NotificationsDrawer.jsx
import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { THEME } from "../../lib/theme";
import { useAppStore } from "../../store/AppStore";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Trash2,
  CheckCheck,
  X,
} from "lucide-react";

// 新增：对接后端（修正命名：notificationApi）
import { notificationApi } from "../../api/sdk";

function ItemIcon({ type }) {
  if (type === "like") return <Heart className="w-4 h-4" />;
  if (type === "comment") return <MessageCircle className="w-4 h-4" />;
  return <UserPlus className="w-4 h-4" />;
}

export default function NotificationsDrawer({ open, onClose }) {
  const {
    notifications,
    addNotification,
    markAllRead,
    removeNotification,
    clearNotifications,
    user,
    items,
  } = useAppStore();

  // 打开时拉取后端通知列表
  useEffect(() => {
    const fetchList = async () => {
      if (!open) return;
      try {
        const userId = user?.id || 1;
        const res = await notificationApi.list({ userId, page: 1, size: 50 });
        const list = res?.data?.list || [];

        // 映射到前端结构：{ id, type, who, bookTitle, time, read }
        const titleById = new Map((items || []).map((b) => [b.id, b.title]));
        const mapped = list.map((n) => {
          const t = n.type === "bookmark" ? "like" : n.type || "follow";
          const who = n.fromUser?.name || "有人";
          const bookTitle = n.bookId
            ? titleById.get(n.bookId) || ""
            : n.bookTitle || "";
          return {
            id: n.id,
            type: t,
            who,
            bookTitle,
            time: n.createdAt || new Date().toISOString(),
            read: !!n.read,
          };
        });

        clearNotifications();
        mapped.forEach(addNotification);
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

            <div className="mt-3 space-y-2 overflow-auto h-[calc(100%-120px)] pr-1">
              {notifications.length === 0 && (
                <div className="text-sm text-gray-500 mt-10 text-center">
                  暂无通知
                </div>
              )}

              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border p-3 bg-white flex items-start gap-2"
                  style={{ borderColor: THEME.border }}
                >
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

                  <div className="flex-1 text-sm">
                    <div className="text-gray-800">
                      <b>{n.who}</b>
                      {n.type === "like" && (
                        <>
                          {" "}
                          赞了你推荐的 <b>{n.bookTitle || "作品"}</b>
                        </>
                      )}
                      {n.type === "comment" && (
                        <>
                          {" "}
                          评论了你推荐的 <b>{n.bookTitle || "作品"}</b>
                        </>
                      )}
                      {n.type !== "like" && n.type !== "comment" && <> 关注了你</>}
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5">
                      {new Date(n.time).toLocaleString()}
                      {!n.read && (
                        <span className="ml-2 text-rose-500">未读</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeNotification(n.id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
