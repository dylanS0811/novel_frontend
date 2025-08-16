import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { THEME } from "../../lib/theme";

export default function SheetDrawer({ open, onClose, defaultValue = {}, onSubmit }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName(defaultValue.name || "");
  }, [open, defaultValue]);

  const handleSubmit = () => {
    const v = name.trim();
    if (!v) return;
    onSubmit(v);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 flex justify-end z-50"
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-[340px] h-full bg-white shadow-xl flex flex-col"
          >
            <div className="p-4 border-b" style={{ borderColor: THEME.border }}>
              <div className="font-semibold">
                {defaultValue?.id ? "编辑书单" : "新增书单"}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm mb-1">书单名称</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2"
                  style={{ borderColor: THEME.border }}
                />
              </div>
            </div>
            <div
              className="p-4 flex justify-end gap-2 border-t"
              style={{ borderColor: THEME.border }}
            >
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-full border"
                style={{ borderColor: THEME.border, background: THEME.surface }}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-full text-white"
                style={{
                  background: "linear-gradient(135deg, #F472B6 0%, #FB7185 100%)",
                }}
              >
                保存
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

