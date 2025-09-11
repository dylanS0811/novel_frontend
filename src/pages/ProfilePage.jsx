// src/pages/ProfilePage.jsx
// 个人中心：头像昵称 + 优雅的昵称编辑卡片 + 书架分栏（收藏 / 我推荐 / 个人书单）
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Edit3, Loader2 } from "lucide-react";
import { THEME } from "../lib/theme";
import { classNames } from "../lib/utils";
import NovelCard from "../components/NovelCard";
import BookSheetPanel from "../components/BookSheetPanel";
import { useAppStore } from "../store/AppStore";
import { meApi, uploadApi, bookApi } from "../api/sdk";
import { useLanguage } from "../i18n";

/** 顶部轻提示（2 秒后自动消失）- 玻璃拟物 + 渐变描边 */
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.6 }}
          style={{
            position: "fixed",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99999,
            padding: 2,
            borderRadius: 14,
            background:
              "linear-gradient(135deg, rgba(251,113,133,0.45), rgba(244,114,182,0.45))",
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                flex: "0 0 auto",
                filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.08))",
              }}
            >
              <circle cx="12" cy="12" r="10" fill="url(#g)" />
              <path
                d="M8.5 12.5l2.2 2.2 4.8-5.2"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="g" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB7185" />
                  <stop offset="1" stopColor="#F472B6" />
                </linearGradient>
              </defs>
            </svg>
            <span style={{ fontWeight: 600 }}>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** 内联组件：我的书架分区（供本页与 BookshelfPage 复用） */
export function BookshelfSection() {
  const {
    savedIds,
    nick,
    toggleSave,
    setCommentsOpen,
    setEditingBook,
    user,
  } = useAppStore();
  const { t } = useLanguage();
  const [tab, setTab] = useState("fav"); // fav | rec | sheet

  const [favorites, setFavorites] = useState([]);
  const [myRecs, setMyRecs] = useState([]);

  // 拉取收藏的书（兼容返回 id 列表或书籍列表）
  useEffect(() => {
    if (!user?.id) {
      setFavorites([]);
      return;
    }
    let aborted = false;
    (async () => {
      try {
        const res = await bookApi.userBookmarks(user.id);
        const data = res?.data ?? res ?? {};
        let list = [];
        const raw = Array.isArray(data)
          ? data
          : Array.isArray(data.list)
          ? data.list
          : Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.ids)
          ? data.ids
          : [];
        if (raw.length > 0 && typeof raw[0] === "object") {
          list = raw;
        } else if (Array.isArray(raw)) {
          const details = await Promise.all(
            raw.map((id) =>
              bookApi
                .detail(id)
                .then((r) => r?.data || r)
                .catch(() => null)
            )
          );
          list = details.filter(Boolean);
        }
        if (!aborted) setFavorites(list);
      } catch (e) {
        console.error("load favorite books failed", e);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [user?.id, savedIds]);

  // 拉取我推荐的书
  useEffect(() => {
    if (!nick && !user?.id) {
      setMyRecs([]);
      return;
    }
    let aborted = false;
    (async () => {
      try {
        const res = await bookApi.list({
          page: 1,
          size: 100,
          ...(user?.id ? { recommenderId: user.id } : { recommender: nick }),
        });
        const data = res || {};
        const list = data.list ?? data.items ?? [];
        if (!aborted) setMyRecs(list);
      } catch (e) {
        console.error("load my rec books failed", e);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [nick, user?.id]);

  const list = tab === "fav" ? favorites : myRecs;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setTab("fav")}
          className={classNames(
            "px-3 py-1.5 rounded-full border",
            tab === "fav" && "bg-rose-50"
          )}
          style={{ borderColor: THEME.border }}
        >
          {t('myFavorites')}
        </button>
        <button
          onClick={() => setTab("rec")}
          className={classNames(
            "px-3 py-1.5 rounded-full border",
            tab === "rec" && "bg-purple-50"
          )}
          style={{ borderColor: THEME.border }}
        >
          {t('myRecs')}
        </button>
        <button
          onClick={() => setTab("sheet")}
          className={classNames(
            "px-3 py-1.5 rounded-full border",
            tab === "sheet" && "bg-amber-50"
          )}
          style={{ borderColor: THEME.border }}
        >
          {t('myBookSheets')}
        </button>
      </div>

      {tab === "sheet" ? (
        <BookSheetPanel />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-5">
          {list.map((item) => (
            <NovelCard
              key={item.id}
              item={item}
              saved={savedIds.has(item.id)}
              onToggleSave={() => toggleSave(item.id)}
              onOpenDetail={() => {}}
              onOpenComments={() => setCommentsOpen({ open: true, item })}
              onOpenUser={() => {}}
              onEdit={() => setEditingBook(item)}
            />
          ))}
          {list.length === 0 && (
            <div className="text-sm text-gray-500">{t('noContent')}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { nick, setNick, avatar, setAvatar, setUser } = useAppStore();
  const { t } = useLanguage();
  const [val, setVal] = useState(nick);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const displayAvatar = avatar || "https://i.pravatar.cc/120?img=15";

  // 配置：昵称长度限制
  const MIN = 2;
  const MAX = 20;

  // 同步输入框到全局 nick（修复刷新后不同步）
  useEffect(() => {
    setVal(nick);
  }, [nick]);

  const trimmed = (val || "").trim();
  const len = trimmed.length;
  const invalid = len < MIN || len > MAX;
  const unchanged = trimmed === (nick || "").trim();

  const saveNick = async () => {
    if (invalid || unchanged || saving) return;
    try {
      setSaving(true);

      // 1) 空校验
      if (!trimmed) {
        setToast(t('enterNickname'));
        return;
      }
      // 2) 重名校验
      const ck = await meApi.checkNickname(trimmed);
      const exists = ck?.data?.exists ?? ck?.exists;
      if (exists) {
        setToast(t('nicknameTaken'));
        return;
      }

      // 3) 保存
      const r = await meApi.patch({ nickname: trimmed });
      const d = r?.data ?? r ?? {};
      setNick(d.nick ?? d.name ?? trimmed);
      setUser((u) => (u ? { ...u, nick: d.nick ?? d.name ?? trimmed } : u));
      setToast(t('saveSuccess'));
    } catch (e) {
      console.error("update nickname failed", e);
      setToast(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = () => fileRef.current?.click();

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/(image\/jpeg|image\/png)/.test(file.type)) {
      setToast(t('avatarType')); // custom key
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setToast(t('avatarTooLarge'));
      return;
    }
    try {
      setUploading(true);
      const res = await uploadApi.avatar(file);
      const url = res?.data?.url ?? res?.url;
      if (!url) throw new Error('no url');
      const tsUrl = `${url}?t=${Date.now()}`;
      setAvatar(tsUrl);
      setUser((u) => (u ? { ...u, avatar: tsUrl } : u));
      await meApi.patch({ avatarUrl: url });
      setToast(t('uploadSuccess'));
    } catch (err) {
      console.error("upload avatar failed", err);
      const status = err?.response?.status;
      if (status === 413) setToast(t('avatarTooLargeSimple'));
      else if (status === 415) setToast(t('avatarTypeUnsupported'));
      else if (status === 400) setToast(err?.response?.data?.message || t('validationFailed'));
      else setToast(t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <Toast message={toast} onClose={() => setToast("")} />

      {/* 顶部：头像 + 昵称 */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative">
          <img src={displayAvatar} className="w-20 h-20 rounded-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
          <button
            type="button"
            onClick={onPickAvatar}
            disabled={uploading}
            className="absolute bottom-0 right-0 px-2 py-1 text-xs rounded-full border bg-white/80 disabled:opacity-60"
            style={{ borderColor: THEME.border }}
          >
            {t('change')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatar}
          />
        </div>
        <div className="text-center sm:text-left">
          <div className="text-xl font-semibold">{nick}</div>
          <div className="text-gray-500 text-sm">{t('myHome')}</div>
        </div>
      </div>

      {/* 修改昵称 — 玻璃拟态小卡片 */}
      <motion.div
        className="mt-6 p-4 rounded-2xl"
        style={{
          // 渐变描边 + 玻璃
          padding: 1,
          background:
            "linear-gradient(135deg, rgba(251,113,133,0.25), rgba(244,114,182,0.25))",
          boxShadow: "0 18px 42px rgba(248,108,139,0.10)",
        }}
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
      >
        <div
          className="rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.82)",
            border: `1px solid ${THEME.border}`,
            backdropFilter: "saturate(130%) blur(8px)",
            WebkitBackdropFilter: "saturate(130%) blur(8px)",
          }}
        >
          {/* 标题行 */}
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">{t('editNickname')}</div>
            <div className="text-[12px] text-gray-400">
              {t('charRange')
                .replace('{min}', MIN)
                .replace('{max}', MAX)}
            </div>
          </div>

          {/* 输入区：缩短宽度、圆角胶囊、带字符计数 */}
          <div className="px-5 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <div className="relative w-full sm:w-auto">
                <input
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  maxLength={MAX + 10} // 软限制，硬提示走 invalid
                  className={classNames(
                    "w-full sm:w-[420px] rounded-full px-4 py-2.5 text-[14px] outline-none transition shadow-sm",
                    "border",
                    invalid
                      ? "border-rose-300 focus:border-rose-400"
                      : "border-[#F1E6EB] focus:border-pink-300"
                  )}
                  style={{
                    background:
                      "linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.9) 100%)",
                  }}
                  placeholder={t('newNicknamePlaceholder')}
                />
                {/* 字符计数 */}
                <div
                  className={classNames(
                    "absolute right-3 top-1/2 -translate-y-1/2 text-[12px]",
                    invalid ? "text-rose-400" : "text-gray-400"
                  )}
                >
                  {len}/{MAX}
                </div>
              </div>

              {/* 保存按钮 */}
              <button
                onClick={saveNick}
                disabled={invalid || unchanged || saving}
                className={classNames(
                  "mt-3 sm:mt-0 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-white text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
                )}
                style={{
                  background: "linear-gradient(135deg,#F472B6,#FB7185)",
                  boxShadow: "0 10px 24px rgba(244,114,182,0.25)",
                  border: "1px solid rgba(255,255,255,0.6)",
                }}
                title={
                  invalid
                    ? t('nicknameLengthHint')
                        .replace('{min}', MIN)
                        .replace('{max}', MAX)
                    : unchanged
                    ? t('noChanges')
                    : t('save')
                }
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    {t('save')}
                  </>
                )}
              </button>
            </div>

            {/* 提示/错误文案 */}
            <div className="mt-2 min-h-[18px] text-[12px]">
              {invalid ? (
                <span className="text-rose-500">
                  {t('nicknameLengthError')
                    .replace('{min}', MIN)
                    .replace('{max}', MAX)}
                </span>
              ) : (
                <span className="text-gray-400">{t('nicknameTip')}</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 书架分栏（直接并入个人中心） */}
      <BookshelfSection />
    </div>
  );
}
