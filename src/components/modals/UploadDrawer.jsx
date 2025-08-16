// src/components/modals/UploadDrawer.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, PlusCircle, X } from "lucide-react";
import { ORIENTATIONS, CATEGORIES, TAGS } from "../../lib/constants";
import { THEME } from "../../lib/theme";
import { tagApi, bookApi } from "../../api/sdk";
import { useAppStore } from "../../store/AppStore";
import { useCreateBook } from "../../api/hooks";
import { useQueryClient } from "@tanstack/react-query";

/** 顶部轻提示（2s 自动消失，玻璃风） */
function Toast({ message = "", type = "success", onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;
  const ok = type === "success";
  return (
    <div
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        padding: 2,
        borderRadius: 14,
        background: ok
          ? "linear-gradient(135deg, rgba(251,113,133,0.45), rgba(244,114,182,0.45))"
          : "linear-gradient(135deg, rgba(248,113,113,0.45), rgba(239,68,68,0.45))",
        boxShadow: "0 14px 30px rgba(244,114,182,0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.78)",
          backdropFilter: "saturate(130%) blur(8px)",
          WebkitBackdropFilter: "saturate(130%) blur(8px)",
          border: "1px solid rgba(255,255,255,0.65)",
          fontSize: 14,
          color: "#3f3f46",
          minWidth: 120,
          justifyContent: "center",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill={ok ? "url(#g1)" : "url(#g2)"} />
          <path
            d={ok ? "M8.5 12.5l2.2 2.2 4.8-5.2" : "M8 8l8 8M16 8l-8 8"}
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="g1" x1="4" y1="4" x2="20" y2="20">
              <stop stopColor="#FB7185" />
              <stop offset="1" stopColor="#F472B6" />
            </linearGradient>
            <linearGradient id="g2" x1="4" y1="4" x2="20" y2="20">
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
        <span style={{ fontWeight: 600 }}>{message}</span>
      </div>
    </div>
  );
}

export default function UploadDrawer({ open, onClose, onSubmit }) {
  const [raw, setRaw] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState([]);
  const [showTagPalette, setShowTagPalette] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [orientation, setOrientation] = useState(ORIENTATIONS[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [blurb, setBlurb] = useState("");
  const [summary, setSummary] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const qc = useQueryClient();
  const createBook = useCreateBook();
  const { user, setPage } = useAppStore();

  // 从原文自动提取默认字段
  useEffect(() => {
    if (!raw) return;
    const m = raw.match(/《([^》]+)》/);
    if (!title) setTitle(m ? `《${m[1]}》` : "未命名-" + Math.floor(Math.random() * 10000));
    if (!blurb) setBlurb((raw || "").slice(0, 60));
    if (!summary) setSummary((raw || "").slice(0, 200));
    // eslint-disable-next-line
  }, [raw]);

  const allBaseTags = useMemo(() => Array.from(new Set(TAGS)), []);
  const [remoteSuggest, setRemoteSuggest] = useState([]);

  // 远端标签建议
  useEffect(() => {
    const q = tagInput.trim();
    if (!q) {
      setRemoteSuggest([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await tagApi.suggest(q);
        const arr = Array.isArray(res?.data) ? res.data : [];
        setRemoteSuggest(arr.slice(0, 10));
      } catch {
        setRemoteSuggest([]);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [tagInput]);

  const suggestions = useMemo(() => {
    const q = tagInput.trim().toLowerCase();
    if (!q) return [];
    const local = allBaseTags
      .filter((t) => !tags.includes(t))
      .filter((t) => t.toLowerCase().includes(q))
      .slice(0, 8);
    const merged = Array.from(new Set([...(remoteSuggest || []), ...local]));
    return merged.slice(0, 8);
  }, [tagInput, allBaseTags, tags, remoteSuggest]);

  const addTag = async (t) => {
    const v = (t || "").trim();
    if (!v) return;
    if (!tags.includes(v)) setTags((arr) => [...arr, v]);
    setTagInput("");
    try {
      // 不强制要求创建成功，失败忽略
      if (!suggestions.includes(v)) {
        await tagApi.create({ name: v });
      }
    } catch {}
  };

  const removeTag = (t) => setTags((arr) => arr.filter((x) => x !== t));

  const onTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  // 真实落库（后端）—— 使用 react-query 的 mutation + 失效刷新
  const fallbackSubmit = async (payload) => {
    const recommenderId = (user && user.id) || payload.recommenderId || 1;
    setSubmitting(true);
    try {
      const res = await createBook.mutateAsync({ ...payload, recommenderId });
      const created = res?.data || res || null;

      // 轻提示
      setToast({ msg: "发布成功", type: "success" });

      // 关闭 + 清表单
      setTimeout(() => {
        onClose && onClose();
        setRaw("");
        setTitle("");
        setAuthor("");
        setTags([]);
        setOrientation(ORIENTATIONS[0]);
        setCategory(CATEGORIES[0]);
        setBlurb("");
        setSummary("");
      }, 300);

      // 关键：触发首页/榜单刷新，并把页码归 1
      setPage(1);
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });

      return created || true;
    } catch (e) {
      console.error("create book failed", e);
      setToast({ msg: "发布失败", type: "error" });
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  // 点击发布
  const handleSubmit = async () => {
    if (!title.trim()) {
      setToast({ msg: "请先填写书名", type: "error" });
      return;
    }
    if (submitting) return;

    // 书名+作者不得重复
    try {
      const resp = await bookApi.checkExist({ title, author });
      const exists = resp?.data?.exists ?? resp?.exists;
      if (exists) {
        setToast({ msg: "已存在同名书籍", type: "error" });
        return;
      }
    } catch (e) {
      console.warn("check book duplicate failed", e);
    }

    const payload = { title, author, tags, raw, orientation, category, blurb, summary };

    // 若父层提供 onSubmit，则先试；若未返回 truthy 或抛错，则回落到真实落库
    if (onSubmit) {
      try {
        setSubmitting(true);
        const ret = await onSubmit(payload);
        if (ret) {
          setToast({ msg: "发布成功", type: "success" });
          setTimeout(() => onClose && onClose(), 300);
          // 触发一次真实拉取，保证和后端一致
          setPage(1);
          qc.invalidateQueries({ queryKey: ["books"] });
          qc.invalidateQueries({ queryKey: ["leaderboard"] });
          return;
        }
      } catch (e) {
        console.warn("onSubmit error, fallback to api.create", e);
      } finally {
        setSubmitting(false);
      }
    }

    // 回落：直接调后端
    try {
      await fallbackSubmit(payload);
    } catch {
      // 已在 fallbackSubmit 里处理 toast
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
          <Toast
            message={toast.msg}
            type={toast.type}
            onClose={() => setToast({ msg: "", type: "success" })}
          />

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
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-5 h-5" style={{ color: THEME.rose }} />
                <div className="font-semibold">闪电上传（60秒）</div>
              </div>

              <textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="粘贴文本或链接（自动提取《书名》、推荐语60字、简介200字）"
                className="w-full border rounded-2xl p-3 h-32 bg白/70"
                style={{ borderColor: THEME.border }}
              />

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">书名</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 bg-white/70"
                    style={{ borderColor: THEME.border }}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">作者</label>
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 bg-white/70"
                    placeholder="可选"
                    style={{ borderColor: THEME.border }}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">性向</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 bg-white"
                    style={{ borderColor: THEME.border }}
                  >
                    {ORIENTATIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">类别</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 bg白"
                    style={{ borderColor: THEME.border }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">推荐语</label>
                <input
                    value={blurb}
                    onChange={(e) => setBlurb(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 bg白/70"
                    placeholder="一句话强推理由（建议≤60字）"
                    style={{ borderColor: THEME.border }}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">简介</label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 h-20 bg白/70"
                    placeholder="内容梗概（建议≤200字）"
                    style={{ borderColor: THEME.border }}
                  />
                </div>
              </div>

              {/* 标签区域 */}
              <div className="mt-3">
                <label className="text-sm text-gray-600">标签</label>

                {/* 已选 */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1"
                      style={{
                        background: "#F6F3FF",
                        color: "#6D28D9",
                        borderColor: "#E9D5FF",
                      }}
                    >
                      #{t}
                      <button onClick={() => removeTag(t)} title="移除">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* 输入 + 自动补全 */}
                <div className="mt-2 flex flex-col gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={onTagKeyDown}
                    className="w-full border rounded-xl px-3 py-2 bg白/70"
                    placeholder="输入标签后回车添加；支持自动检索"
                    style={{ borderColor: THEME.border }}
                  />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => addTag(s)}
                        className="text-xs px-2 py-1 rounded-lg border hover:bg-rose-50"
                        style={{ borderColor: THEME.border, background: THEME.surface }}
                      >
                        #{s}
                      </button>
                    ))}
                    {tagInput.trim() &&
                      !suggestions.includes(tagInput.trim()) &&
                      !tags.includes(tagInput.trim()) && (
                        <button
                          onClick={() => addTag(tagInput)}
                          className="text-xs px-2 py-1 rounded-lg border"
                          style={{
                            borderColor: THEME.border,
                            background: "#FFF7FA",
                            color: "#E11D48",
                          }}
                        >
                          创建标签 “{tagInput.trim()}”
                        </button>
                      )}
                  </div>
                </div>

                {/* 常用标签面板 */}
                <div className="mt-2">
                  <button
                    onClick={() => setShowTagPalette((v) => !v)}
                    className="text-xs px-2 py-1 rounded-full border"
                    style={{ borderColor: THEME.border, background: THEME.surface }}
                  >
                    <PlusCircle className="w-3 h-3 inline-block mr-1" /> 选择常用标签
                  </button>
                </div>

                <AnimatePresence>
                  {showTagPalette && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2"
                    >
                      {allBaseTags.map((t) => (
                        <button
                          key={t}
                          onClick={() => addTag(t)}
                          className="text-xs px-2 py-1 rounded-lg border hover:bg-rose-50"
                          style={{ borderColor: THEME.border, background: THEME.surface }}
                        >
                          #{t}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-2 rounded-full border"
                  style={{ borderColor: THEME.border, background: THEME.surface }}
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-full text白"
                  style={{
                    background: "linear-gradient(135deg, #F472B6 0%, #FB7185 100%)",
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                  disabled={submitting}
                >
                  {submitting ? "发布中…" : "发布"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
