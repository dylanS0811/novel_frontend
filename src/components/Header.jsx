// src/components/Header.jsx
// 顶部导航：品牌、搜索、上传、个人中心/登录、通知中心
import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  Upload,
  Bell,
  Flame,
  Sparkles,
  LogOut,
  User2,
  Menu,
  X,
} from "lucide-react";
import MobileMenuDrawer from "./modals/MobileMenuDrawer";
import BookHamsterIcon from "./icons/BookHamsterIcon";
import ConfirmModal from "./modals/ConfirmModal";
import { THEME } from "../lib/theme";
import { classNames } from "../lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "../store/AppStore";

function FilterPill({ active, onClick, icon, label, grad }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={classNames(
        "px-3 py-1.5 rounded-full flex items-center gap-1 text-sm border transition",
        active ? "text-white" : "bg-white hover:border-rose-200"
      )}
      style={{
        background: active ? grad : THEME.surface,
        borderColor: THEME.border,
        boxShadow: active ? THEME.shadow : "none",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function Header(props) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  const store = useAppStore();
  const tab = store.tab;
  const setTab = store.setTab;
  const onOpenUpload = props.onOpenUpload ?? (() => store.setShowUpload(true));

  // 搜索
  const [q, setQ] = useState(store.search || "");
  const triggerSearch = () => {
    store.setSearch((q || "").trim());
    store.setPage(1);
    if (!isHome) nav("/");
  };

  useEffect(() => {
    const t = setTimeout(() => {
      store.setSearch((q || "").trim());
      store.setPage(1);
      if (pathname !== "/") nav("/");
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // 点击品牌：回首页 + 清空筛选/搜索 + 默认“新粮”
  const goHomeReset = () => {
    store.resetFilters();
    nav("/");
  };

  // 用户菜单 & 退出确认
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // 点击外部关闭用户下拉
  useEffect(() => {
    const onClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const doLogout = () => {
    setConfirmOpen(false);
    setMenuOpen(false);
    store.logout();        // 清 token / user
    store.resetFilters();  // 回默认筛选
    nav("/");              // 回首页
  };

  return (
    <div
      className="sticky top-0 z-40 backdrop-blur-xl border-b"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,246,249,0.65) 100%)",
        borderColor: THEME.border,
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* 品牌：点击回首页 + 清空筛选/搜索 + 默认新粮 */}
          <button
            onClick={goHomeReset}
            className="flex items-center gap-3"
            title="返回首页（清空筛选/搜索）"
            type="button"
          >
            <BookHamsterIcon size={52} radius={12} />
            {/* 标题 + 副标题 */}
            <div className="flex flex-col items-start leading-tight">
              <div
                className="font-extrabold text-xl tracking-wide"
                style={{ color: THEME.rose }}
              >
                摸鱼书架
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: "rgba(84, 65, 72, 0.52)" }}>
                分享你的宝藏小说
              </div>
            </div>
          </button>

          <div className="flex-1" />

          {/* 搜索 */}
          <div
            className="hidden md:flex items-center gap-2 rounded-full px-3 py-2 shadow-sm border"
            style={{ background: THEME.surface, borderColor: THEME.border }}
          >
            <Search className="w-4 h-4 text-gray-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
              placeholder="搜索 书名/作者/标签"
              className="w-56 outline-none bg-transparent"
            />
            <button
              type="button"
              onClick={triggerSearch}
              className="px-3 py-1 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #F472B6 0%, #FB7185 100%)" }}
              title="搜索"
            >
              搜索
            </button>
          </div>

          {/* mobile search button */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="md:hidden p-2 rounded-md hover:bg-rose-50"
            type="button"
            title="搜索"
          >
            <Search className="w-6 h-6" />
          </button>

          {/* mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-md hover:bg-rose-50"
            type="button"
            title="菜单"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* 闪电上传 */}
          <button
            onClick={() => (store.user ? onOpenUpload() : store.setAuthOpen(true))}
            className="ml-2 hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-white shadow"
            style={{
              background:
                "linear-gradient(135deg, #F86C8B 0%, #FFA2B6 60%, #FFD0DA 100%)",
              boxShadow: THEME.shadow,
            }}
            type="button"
          >
            <Upload className="w-4 h-4" />
            闪电上传
          </button>

          {/* 登录 / 个人中心（带下拉） */}
          {store.user ? (
            <div className="relative ml-2 hidden md:block" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-2 py-1.5 rounded-full border bg-white"
                style={{ borderColor: THEME.border }}
                title="我的"
                type="button"
              >
                <img
                  src={store.user.avatar || "https://i.pravatar.cc/80?img=15"}
                  className="w-6 h-6 rounded-full"
                  alt="me"
                />
                <span className="hidden sm:inline text-sm text-gray-700">我的</span>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "saturate(130%) blur(8px)",
                    WebkitBackdropFilter: "saturate(130%) blur(8px)",
                    border: "1px solid rgba(241,230,234,0.9)",
                    boxShadow: "0 16px 36px rgba(0,0,0,0.08)",
                  }}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      nav("/me");
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-rose-50"
                  >
                    <User2 className="w-4 h-4" />
                    我的主页
                  </button>

                  <div className="h-px my-1" style={{ background: "#f3e7eb" }} />

                  <button
                    onClick={() => setConfirmOpen(true)}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => store.setAuthOpen(true)}
              className="ml-2 hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-white"
              style={{ background: "linear-gradient(135deg,#C084FC,#A78BFA)" }}
              type="button"
              title="登录/注册"
            >
              游客 · 登录
            </button>
          )}

          {/* 通知中心 */}
          <button
            className="relative ml-1 hidden md:block"
            title="通知中心"
            type="button"
            onClick={() => (store.user ? store.setNotifyOpen(true) : store.setAuthOpen(true))}
          >
            <Bell className="w-6 h-6 text-gray-700" />
            {store.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] bg-rose-500 text-white rounded-full flex items-center justify-center">
                {store.unreadCount > 99 ? '99+' : store.unreadCount}
              </span>
            )}
          </button>
        </div>

        {mobileSearchOpen && (
          <div
            className="mt-2 md:hidden flex items-center gap-2 rounded-full px-3 py-2 shadow-sm border"
            style={{ background: THEME.surface, borderColor: THEME.border }}
          >
            <Search className="w-4 h-4 text-gray-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
              placeholder="搜索 书名/作者/标签"
              className="flex-1 outline-none bg-transparent"
            />
            <button
              type="button"
              onClick={triggerSearch}
              className="px-3 py-1 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #F472B6 0%, #FB7185 100%)" }}
              title="搜索"
            >
              搜索
            </button>
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="p-1 ml-1 rounded-md hover:bg-rose-50"
              type="button"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 首页才显示：热榜 / 新粮 */}
        {isHome && (
          <div className="mt-3 flex items-center gap-2">
            <FilterPill
              active={tab === "hot"}
              onClick={() => setTab("hot")}
              icon={<Flame className="w-4 h-4" />}
              label="热榜（点赞）"
              grad="linear-gradient(135deg, #FB7185 0%, #F472B6 100%)"
            />
            <FilterPill
              active={tab === "new"}
              onClick={() => setTab("new")}
              icon={<Sparkles className="w-4 h-4" />}
              label="新粮（时间）"
              grad="linear-gradient(135deg, #C084FC 0%, #A78BFA 100%)"
            />
          </div>
        )}
      </div>

      {/* 退出确认弹窗（用 Portal 渲染到 body） */}
      <MobileMenuDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenUpload={onOpenUpload}
      />
      <ConfirmModal
        open={confirmOpen}
        title="退出登录"
        content="确定要退出当前账号吗？"
        confirmText="退出"
        cancelText="取消"
        onConfirm={doLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
