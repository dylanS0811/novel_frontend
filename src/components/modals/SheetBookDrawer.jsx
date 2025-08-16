import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { THEME } from "../../lib/theme";

export default function SheetBookDrawer({ open, onClose, defaultValue = {}, onSubmit }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [orientation, setOrientation] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(defaultValue.title || "");
      setAuthor(defaultValue.author || "");
      setOrientation(defaultValue.orientation || "");
      setCategory(defaultValue.category || "");
      setRating(
        defaultValue.rating != null ? String(defaultValue.rating) : ""
      );
      setReview(defaultValue.review || "");
    }
  }, [open, defaultValue]);

  const handleSubmit = () => {
    const payload = {
      title: title.trim(),
      author: author.trim(),
      orientation: orientation.trim(),
      category: category.trim(),
      review: review.trim(),
    };
    const r = Number(rating);
    if (!Number.isNaN(r)) payload.rating = r;
    if (!payload.title) return;
    onSubmit(payload);
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
            className="w-full max-w-[420px] h-full bg-white shadow-xl flex flex-col"
          >
            <div className="p-4 border-b" style={{ borderColor: THEME.border }}>
              <div className="font-semibold">
                {defaultValue?.id ? "编辑书籍" : "添加书籍"}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm mb-1">书名</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2"
                  style={{ borderColor: THEME.border }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">作者</label>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2"
                  style={{ borderColor: THEME.border }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">性向</label>
                  <input
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2"
                    style={{ borderColor: THEME.border }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">类型</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2"
                    style={{ borderColor: THEME.border }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">评分</label>
                <input
                  type="number"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2"
                  style={{ borderColor: THEME.border }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">评价</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 h-24 resize-none"
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

