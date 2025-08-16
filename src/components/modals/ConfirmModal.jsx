// src/components/modals/ConfirmModal.jsx
import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

/**
 * 全局确认弹窗（居中 + 遮罩 + 玻璃风）
 * props:
 * - open: boolean
 * - title?: string
 * - content?: string | ReactNode
 * - confirmText?: string
 * - cancelText?: string
 * - onConfirm?: () => void
 * - onCancel?: () => void
 */
export default function ConfirmModal({
  open,
  title = "确认操作",
  content = "确定要继续吗？",
  confirmText = "确定",
  cancelText = "取消",
  onConfirm,
  onCancel,
}) {
  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onCancel?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  const body = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.3)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="w-[92%] max-w-[440px] rounded-2xl p-5"
            style={{
              background: "rgba(255,255,255,0.82)",
              backdropFilter: "saturate(130%) blur(10px)",
              WebkitBackdropFilter: "saturate(130%) blur(10px)",
              border: "1px solid rgba(255,255,255,0.65)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
            }}
            initial={{ scale: 0.98, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
          >
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-sm text-gray-600 mt-3">{content}</div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={onCancel}
                className="px-3 py-2 rounded-full border text-sm"
                style={{ borderColor: "#f1e6ea", background: "#fff7fa" }}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="px-3 py-2 rounded-full text-sm text-white"
                style={{ background: "linear-gradient(135deg,#F472B6,#FB7185)" }}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 用 portal 渲染到 body，避免受 Header 等容器样式影响
  return createPortal(body, document.body);
}
