import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { THEME } from "../../lib/theme";

// 简介弹窗
export default function SummaryModal({ open, onClose, title, summary }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" style={{ background: "rgba(20,16,21,0.35)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div onClick={(e) => e.stopPropagation()} className="absolute left-1/2 -translate-x-1/2 top-16 w-[95%] md:w-[640px] rounded-3xl overflow-hidden"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,244,247,0.95) 100%)", boxShadow: THEME.shadowHover, border: `1px solid ${THEME.border}` }}
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
            <div className="px-5 py-4 text-white" style={{ background: "linear-gradient(135deg, #F472B6 0%, #FB7185 70%)" }}>
              <div className="flex items-center justify-between">
                <div className="font-semibold">简介 · {title}</div>
                <button onClick={onClose} className="p-1 rounded-full bg-white/20"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-5 text-[15px] leading-relaxed whitespace-pre-wrap">{summary || "暂无简介~"}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
