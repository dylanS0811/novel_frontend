// src/pages/ProfilePage.jsx
// 个人中心：头像昵称 + 修改昵称 + 书架分栏（收藏 / 我推荐 / 个人书单）
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Edit3 } from "lucide-react";
import { THEME } from "../lib/theme";
import { classNames } from "../lib/utils";
import NovelCard from "../components/NovelCard";
import BookSheetPanel from "../components/BookSheetPanel";
import { useAppStore } from "../store/AppStore";
import { meApi } from "../api/sdk";

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
  const { items, savedIds, nick, toggleSave, setCommentsOpen } = useAppStore();
  const [tab, setTab] = useState("fav"); // fav | rec | sheet

  const favorites = items.filter((i) => savedIds.has(i.id));
  const myRecs = items.filter((i) => i?.recommender?.name === nick);

  const list = tab === "fav" ? favorites : myRecs;

  return (
    <div className="mt-6">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("fav")}
          className={classNames(
            "px-3 py-1.5 rounded-full border",
            tab === "fav" && "bg-rose-50"
          )}
          style={{ borderColor: THEME.border }}
        >
          我收藏的书
        </button>
        <button
          onClick={() => setTab("rec")}
          className={classNames(
            "px-3 py-1.5 rounded-full border",
            tab === "rec" && "bg-purple-50"
          )}
          style={{ borderColor: THEME.border }}
        >
          我推荐的书
        </button>
        <button
          onClick={() => setTab("sheet")}
          className={classNames(
            "px-3 py-1.5 rounded-full border",
            tab === "sheet" && "bg-amber-50"
          )}
          style={{ borderColor: THEME.border }}
        >
          我的个人书单
        </button>
      </div>

      {tab === "sheet" ? (
        <BookSheetPanel />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((item) => (
            <NovelCard
              key={item.id}
              item={item}
              saved={savedIds.has(item.id)}
              onToggleSave={() => toggleSave(item.id)}
              onOpenDetail={() => {}}
              onOpenComments={() => setCommentsOpen({ open: true, item })}
              onOpenUser={() => {}}
            />
          ))}
          {list.length === 0 && <div className="text-sm text-gray-500">暂无内容</div>}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { nick, setNick, avatar } = useAppStore();
  const [val, setVal] = useState(nick);
  const [toast, setToast] = useState("");
  const displayAvatar = avatar || "https://i.pravatar.cc/120?img=15";

  // 同步输入框到全局 nick（修复刷新后不同步）
  useEffect(() => {
    setVal(nick);
  }, [nick]);

  const saveNick = async () => {
    try {
      const v = val.trim();
      if (!v) {
        setToast("请输入昵称");
        return;
      }

      const ck = await meApi.checkNickname(v);
      const exists = ck?.data?.exists ?? ck?.exists;
      if (exists) {
        setToast("昵称已被占用");
        return;
      }

      const r = await meApi.patch({ nickname: v, avatar });
      const d = r?.data ?? r ?? {};
      setNick(d.nick ?? v);
      setToast("保存成功");
    } catch (e) {
      console.error("update nickname failed", e);
      setNick(val);
      setToast("保存失败");
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <Toast message={toast} onClose={() => setToast("")} />

      {/* 顶部：头像 + 昵称 */}
      <div className="flex items-center gap-4">
        <img src={displayAvatar} className="w-20 h-20 rounded-full" />
        <div>
          <div className="text-xl font-semibold">{nick}</div>
          <div className="text-gray-500 text-sm">我的主页</div>
        </div>
      </div>

      {/* 修改昵称 */}
      <div className="mt-6 p-4 rounded-2xl border bg-white" style={{ borderColor: THEME.border }}>
        <div className="text-sm text-gray-600 mb-2">修改昵称</div>
        <div className="flex items-center gap-2">
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="flex-1 border rounded-xl px-3 py-2"
            style={{ borderColor: THEME.border }}
          />
        </div>
        <div className="mt-3">
          <button
            onClick={saveNick}
            className="px-3 py-2 rounded-xl text-white"
            style={{ background: "linear-gradient(135deg,#F472B6,#FB7185)" }}
          >
            <Edit3 className="w-4 h-4 inline mr-1" /> 保存
          </button>
        </div>
      </div>

      {/* 书架分栏（直接并入个人中心） */}
      <BookshelfSection />
    </div>
  );
}
