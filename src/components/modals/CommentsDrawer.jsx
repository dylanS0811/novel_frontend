import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { THEME } from "../../lib/theme";

// 评论抽屉
// 数据来源与新增评论均由父组件通过 props(list / onAdd) 对接后端
export default function CommentsDrawer({ open, onClose, item, list, onAdd }) {
  const [text, setText] = useState("");
  if (!item) return null;

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      // onAdd 负责调接口 + 更新全局缓存（含 user.avatar / user.name）
      await onAdd(text.trim());
      setText(""); // 清空输入框
    } catch (e) {
      console.error("添加评论失败", e);
    }
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
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 评论列表 */}
            <div className="p-4 space-y-3 overflow-auto h-[calc(100%-140px)]">
              {list.length === 0 && (
                <div className="text-sm text-gray-500">
                  还没有评论，来占个楼吧～
                </div>
              )}
              {list.map((c, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  {/* 头像：如果后端没传，显示默认头像 */}
                  <img
                    src={c.avatar || "/default-avatar.png"}
                    alt={c.user}
                    className="w-7 h-7 rounded-full object-cover bg-gray-200"
                  />
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-medium mr-2">
                        {c.user || "匿名用户"}
                      </span>
                      <span className="text-gray-400">{c.time}</span>
                    </div>
                    <div className="text-sm mt-0.5">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 输入框 */}
            <div
              className="p-4 border-t"
              style={{ borderColor: THEME.border }}
            >
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
                  style={{
                    background: "linear-gradient(135deg,#F472B6,#FB7185)",
                  }}
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
