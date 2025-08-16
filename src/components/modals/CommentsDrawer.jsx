import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart } from "lucide-react";
import { THEME } from "../../lib/theme";
import { formatDate } from "../../lib/utils";

// 评论抽屉，支持点赞与回复
export default function CommentsDrawer({ open, onClose, item, list, onAdd, onLike }) {
  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingId, setReplyingId] = useState(null);
  const [openReplies, setOpenReplies] = useState({});

  if (!item) return null;

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await onAdd(text.trim());
      setText("");
    } catch (e) {
      console.error("添加评论失败", e);
    }
  };

  const handleSendReply = async (parentId) => {
    if (!replyText.trim()) return;
    try {
      await onAdd(replyText.trim(), parentId);
      setReplyText("");
      setReplyingId(null);
    } catch (e) {
      console.error("回复失败", e);
    }
  };

  const renderComment = (c, depth = 0) => {
    const hasReplies = c.replies && c.replies.length > 0;
    const opened = openReplies[c.id];
    return (
      <div
        key={c.id}
        className="flex items-start gap-2"
        style={{ marginLeft: depth ? depth * 24 : 0 }}
      >
        <img
          src={c.userAvatar || "/default-avatar.png"}
          alt={c.userName}
          className="w-7 h-7 rounded-full object-cover bg-gray-200"
        />
        <div className="flex-1">
          <div className="text-sm">
            <span className="font-medium mr-2">{c.userName || "匿名用户"}</span>
            <span className="text-gray-400">{formatDate(c.createdAt)}</span>
          </div>
          <div className="text-sm mt-0.5">{c.text}</div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <button
              onClick={() => onLike?.(c.id)}
              className={`flex items-center gap-1 ${c.liked ? "text-pink-500" : "hover:text-pink-500"}`}
            >
              <Heart className="w-3 h-3" fill={c.liked ? "currentColor" : "none"} />
              {c.likes || 0}
            </button>
            <button
              onClick={() => {
                setReplyingId(c.id);
                setReplyText("");
              }}
              className="hover:text-pink-500"
            >
              回复
            </button>
            {hasReplies && depth === 0 && (
              <button
                onClick={() => setOpenReplies((o) => ({ ...o, [c.id]: !o[c.id] }))}
                className="hover:text-pink-500"
              >
                {opened ? "收起回复" : `${c.replies.length}条回复`}
              </button>
            )}
          </div>
          {replyingId === c.id && (
            <div className="flex items-center gap-2 mt-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="回复……"
                className="flex-1 border rounded-xl px-3 py-1"
                style={{ borderColor: THEME.border }}
              />
              <button
                onClick={() => handleSendReply(c.id)}
                className="px-3 py-1 rounded-xl text-white"
                style={{ background: "linear-gradient(135deg,#F472B6,#FB7185)" }}
              >
                发送
              </button>
            </div>
          )}
          {hasReplies && (depth > 0 || opened) && (
            <div className="mt-2 space-y-2">
              {c.replies.map((r) => renderComment(r, depth + 1))}
            </div>
          )}
        </div>
      </div>
    );
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
            className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-xl"
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
          >
            {/* 标题 */}
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: THEME.border }}
            >
              <div className="font-semibold">评论 · {item.title}</div>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 评论列表 */}
            <div className="p-4 space-y-3 overflow-auto h-[calc(100%-140px)]">
              {list.length === 0 && (
                <div className="text-sm text-gray-500">还没有评论，来占个楼吧～</div>
              )}
              {list.map((c) => renderComment(c))}
            </div>

            {/* 输入框 */}
            <div className="p-4 border-t" style={{ borderColor: THEME.border }}>
              <div className="flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="说点什么……"
                  className="flex-1 border rounded-xl px-3 py-2"
                  style={{ borderColor: THEME.border }}
                />
                <button
                  onClick={handleSend}
                  className="px-3 py-2 rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg,#F472B6,#FB7185)" }}
                >
                  发送
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

