import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * 触发一个全局 Toast：
 *   showToast("已转移到「XX 书单」")
 */
export function showToast(message) {
  const ev = new CustomEvent("app:toast", { detail: { message } });
  window.dispatchEvent(ev);
}

/* 单条气泡 */
export default function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000); // 2 秒后自动关闭
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      layout
      initial={{ y: -12, opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -8, opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.6 }}
      className="relative pointer-events-auto"
    >
      <div
        className="rounded-2xl px-4 py-2 border shadow-lg"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderColor: "rgba(246, 212, 220, 0.9)",
          boxShadow: "0 12px 32px rgba(248,108,139,0.18)",
          color: "#333",
          fontSize: 14,
        }}
      >
        {message}
      </div>
      {/* 小尾巴（聊天气泡感） */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: "100%",
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid rgba(255,255,255,0.92)",
          filter: "drop-shadow(0 2px 2px rgba(248,108,139,0.18))",
        }}
      />
    </motion.div>
  );
}

/* 全局托管容器：挂在 App 根部一次即可 */
export function ToastHost() {
  const [items, setItems] = React.useState([]);

  useEffect(() => {
    function onToast(e) {
      const id = Math.random().toString(36).slice(2);
      const msg = e?.detail?.message ?? "";
      setItems((arr) => [...arr, { id, msg }]);
    }
    window.addEventListener("app:toast", onToast);
    return () => window.removeEventListener("app:toast", onToast);
  }, []);

  const handleClose = (id) => setItems((arr) => arr.filter((x) => x.id !== id));

  return (
    <div className="fixed top-4 left-0 right-0 z-[2000] pointer-events-none">
      <div className="w-full flex justify-center">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <Toast key={t.id} message={t.msg} onClose={() => handleClose(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
