import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

export default function MoveBookModal({ open, sheets = [], onCancel, onConfirm }) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (open) {
      setSelected(sheets[0]?.id ?? null);
    }
  }, [open, sheets]);

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
            <div className="text-lg font-semibold">转移到其他书单</div>
            <div className="mt-3 max-h-[50vh] overflow-auto space-y-2">
              {sheets.length === 0 && (
                <div className="text-sm text-gray-500">暂无其他书单</div>
              )}
              {sheets.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="move-sheet"
                    value={s.id}
                    checked={selected === s.id}
                    onChange={() => setSelected(s.id)}
                  />
                  <span>{s.name || s.title}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={onCancel}
                className="px-3 py-2 rounded-full border text-sm"
                style={{ borderColor: "#f1e6ea", background: "#fff7fa" }}
              >
                取消
              </button>
              <button
                onClick={() => selected && onConfirm(selected)}
                disabled={!selected}
                className="px-3 py-2 rounded-full text-sm text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#F472B6,#FB7185)" }}
              >
                确定
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(body, document.body);
}
