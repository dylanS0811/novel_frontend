// src/App.jsx
// 应用根布局：Header + 路由出口 + Footer + 全局弹层（上传/详情/评论/登录/通知）
import React from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import BookshelfPage from "./pages/BookshelfPage";
import UserProfilePage from "./pages/UserProfilePage";
import UploadDrawer from "./components/modals/UploadDrawer";
import DetailModal from "./components/modals/DetailModal";
import CommentsDrawer from "./components/modals/CommentsDrawer";
import AuthModal from "./components/modals/AuthModal";
import NotificationsDrawer from "./components/modals/NotificationsDrawer";
import { useAppStore } from "./store/AppStore";
import { Plus } from "lucide-react";
import { THEME } from "./lib/theme";
import { ToastHost } from "./components/ui/Toast";

function Shell() {
  const qc = useQueryClient();

  const {
    showUpload,
    setShowUpload,
    detail,
    setDetail,
    commentsOpen,
    setCommentsOpen,
    // 这两个之前没取，导致评论功能没线连上
    commentsMap, // ← 从 store 取评论列表 Map
    addComment, // ← 从 store 取“发表评论”的方法（已对接后端）
    toggleCommentLike,
    items,
    setItems,
    nick,
    authOpen,
    setAuthOpen,
    notifyOpen,
    setNotifyOpen,
    setPage,
    user,
  } = useAppStore();

  // 发布上传（保持原有本地插卡行为；UploadDrawer 里也已接上后端，二者兼容）
  const onSubmitUpload = ({
    title,
    author,
    tags,
    raw,
    orientation,
    category,
    blurb,
    summary,
  }) => {
    const newItem = {
      id: Math.random().toString(36).slice(2),
      title: title || "未命名-" + Math.floor(Math.random() * 10000),
      author: author || "佚名",
      orientation: orientation || "其他",
      category: category || "剧情",
      blurb: blurb || (raw || "").slice(0, 60),
      summary: summary || (raw || "").slice(0, 200),
      tags: tags && tags.length ? tags : ["推荐"],
      createdAt: new Date().toISOString(),
      likes: 0,
      bookmarks: 0,
      comments: 0,
      recommender: {
        name: nick,
        nick: nick,
        avatar: "https://i.pravatar.cc/80?img=15",
        count: 1,
      },
    };
    setItems((arr) => [newItem, ...arr]);
    setShowUpload(false);
    // 统一与后端数据同步：回到第1页并失效刷新
    setPage(1);
    qc.invalidateQueries({ queryKey: ["books"] });
    qc.invalidateQueries({ queryKey: ["leaderboard"] });
  };

  const currentBookId = commentsOpen?.item?.id;
  // 使用数字键读取，避免字符串/数字混用导致取不到缓存的评论
  const commentList = currentBookId
    ? commentsMap[Number(currentBookId)] || []
    : [];

  // ✅ 关键修复：发表评论后，除更新本地 commentsMap 外，失效刷新首页/榜单，让评论数立刻 +1
  const handleAddComment = async (text, parentId) => {
    if (typeof addComment !== "function") return;
    await addComment(text, parentId); // 调后端并更新 commentsMap
    qc.invalidateQueries({ queryKey: ["books"] });
    qc.invalidateQueries({ queryKey: ["leaderboard"] });
  };

  return (
    <>
      {/* Header 使用全局 store */}
      <Header onOpenUpload={() => setShowUpload(true)} />
      <Outlet />
      <Footer />

      {/* 右下角悬浮 + 按钮：当评论抽屉打开时隐藏，避免遮挡输入框 */}
      {!commentsOpen.open && (
        <button
          onClick={() => (user ? setShowUpload(true) : setAuthOpen(true))}
          title="闪电上传"
          className="fixed bottom-6 right-6 rounded-full shadow-lg flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            background:
              "linear-gradient(135deg, #F86C8B 0%, #FFA2B6 60%, #FFD0DA 100%)",
            boxShadow: THEME.shadowHover,
            border: `1px solid ${THEME.border}`,
            color: "#fff",
            zIndex: 60,
          }}
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* 全局弹层 */}
      <UploadDrawer
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onSubmit={onSubmitUpload}
      />
      <DetailModal open={!!detail} onClose={() => setDetail(null)} item={detail} />

      {/* 评论抽屉：list 传入实际评论数组；onAdd 统一失效刷新 */}
      <CommentsDrawer
        open={commentsOpen.open}
        onClose={() => setCommentsOpen({ open: false, item: null })}
        item={commentsOpen.item}
        list={commentList}
        onAdd={handleAddComment}
        onLike={toggleCommentLike}
      />

      {/* 登录/注册（挂载根部） */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* 通知中心（挂载根部） */}
      <NotificationsDrawer open={notifyOpen} onClose={() => setNotifyOpen(false)} />

      {/* 全局 Toast 宿主（顶部浅色聊天气泡） */}
      <ToastHost />
        
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="/me" element={<ProfilePage />} />
        <Route path="/me/bookshelf" element={<BookshelfPage />} />
        <Route path="/u/:nick" element={<UserProfilePage />} />
      </Route>
    </Routes>
  );
}
