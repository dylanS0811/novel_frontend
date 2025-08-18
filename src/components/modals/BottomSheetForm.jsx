import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ORIENTATIONS, CATEGORIES } from "../../lib/constants";
import CuteSelect from "../ui/CuteSelect";
import { THEME } from "../../lib/theme";
import { useAppStore } from "../../store/AppStore";

export default function BottomSheetForm({
  mode = "list",
  open = false,
  onClose = () => {},
  onSubmit = () => {},
  initialValues = {},
}) {
  const { user } = useAppStore();
  const storageKey = useMemo(
    () => `bsf-${user?.id || "guest"}-${mode}`,
    [user?.id, mode]
  );

  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  // 加载草稿
  useEffect(() => {
    if (!open) return;
    let data = {};
    if (initialValues && Object.keys(initialValues).length > 0) {
      data = initialValues;
    } else {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) data = JSON.parse(saved);
      } catch {}
    }
    const { cover, coverUrl, ...rest } = data;
    setForm({
      name: "",
      intro: "",
      visibility: "public",
      title: "",
      author: "",
      orientation: ORIENTATIONS[0],
      category: CATEGORIES[0],
      rating: "",
      review: "",
      summary: "",
      tags: "",
      ...rest,
    });
    setErrors({});
  }, [open, storageKey, initialValues]);

  // 草稿保存
  useEffect(() => {
    if (!open) return;
    const { name, intro, visibility, title, author, orientation, category, rating, review, summary, tags } = form;
    const payload = { name, intro, visibility, title, author, orientation, category, rating, review, summary, tags };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {}
  }, [open, form, storageKey]);

  const handleChange = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validate = () => {
    const errs = {};
    if (mode === "list") {
      if (!form.name?.trim()) errs.name = "请输入名称";
    } else {
      if (!form.title?.trim()) errs.title = "请输入书名";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const { cover, coverUrl, ...payload } = form;
    onSubmit(payload);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    onClose();
  };

  // esc 关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const titleText = mode === "book" ? (form.id ? "编辑书籍" : "新增书籍") : form.id ? "编辑书单" : "新增书单";

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
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 max-h-[85vh] overflow-auto"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #FFF4F7 100%)",
              boxShadow: THEME.shadowHover,
              borderTop: `1px solid ${THEME.border}`,
            }}
            initial={{ y: 400 }}
            animate={{ y: 0 }}
            exit={{ y: 400 }}
          >
            <div className="max-w-3xl mx-auto">
              <div className="mb-4">
                <div className="text-lg font-semibold">{titleText}</div>
                <div className="text-sm text-gray-600">请完整填写以下信息</div>
              </div>

              {mode === "list" ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">名称 *</label>
                    <input
                      value={form.name || ""}
                      onChange={handleChange("name")}
                      className="w-full border rounded-xl px-3 py-2"
                      style={{ borderColor: errors.name ? "#f43f5e" : THEME.border }}
                    />
                    {errors.name && (
                      <div className="text-xs text-red-500 mt-1">{errors.name}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">简介</label>
                    <textarea
                      value={form.intro || ""}
                      onChange={handleChange("intro")}
                      className="w-full border rounded-xl px-3 py-2 h-24"
                      style={{ borderColor: THEME.border }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">可见性</label>
                    <CuteSelect
                      value={form.visibility || "public"}
                      onChange={handleChange("visibility")}
                      options={[{ label: "公开", value: "public" }, { label: "私密", value: "private" }]}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">书名 *</label>
                    <input
                      value={form.title || ""}
                      onChange={handleChange("title")}
                      className="w-full border rounded-xl px-3 py-2"
                      style={{ borderColor: errors.title ? "#f43f5e" : THEME.border }}
                    />
                    {errors.title && (
                      <div className="text-xs text-red-500 mt-1">{errors.title}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">作者</label>
                    <input
                      value={form.author || ""}
                      onChange={handleChange("author")}
                      className="w-full border rounded-xl px-3 py-2"
                      style={{ borderColor: THEME.border }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1">性向</label>
                      <CuteSelect
                        value={form.orientation}
                        onChange={handleChange("orientation")}
                        options={ORIENTATIONS}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">类型</label>
                      <CuteSelect
                        value={form.category}
                        onChange={handleChange("category")}
                        options={CATEGORIES}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">评分 (0-10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={form.rating || ""}
                      onChange={handleChange("rating")}
                      className="w-full border rounded-xl px-3 py-2"
                      style={{ borderColor: THEME.border }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">一句话推荐理由</label>
                    <textarea
                      value={form.review || ""}
                      onChange={handleChange("review")}
                      className="w-full border rounded-xl px-3 py-2 h-20"
                      style={{ borderColor: THEME.border }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">简介</label>
                    <textarea
                      value={form.summary || ""}
                      onChange={handleChange("summary")}
                      className="w-full border rounded-xl px-3 py-2 h-28"
                      style={{ borderColor: THEME.border }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">标签（逗号分隔）</label>
                    <input
                      value={form.tags || ""}
                      onChange={handleChange("tags")}
                      className="w-full border rounded-xl px-3 py-2"
                      style={{ borderColor: THEME.border }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
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
                  style={{ background: "linear-gradient(135deg, #F472B6 0%, #FB7185 100%)" }}
                >
                  保存
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

