// 兼容旧路由：/me/bookshelf 复用个人中心的 BookshelfSection
import React from "react";
import { BookshelfSection } from "./ProfilePage";
import { useAppStore } from "../store/AppStore";

export default function BookshelfPage() {
  const { user, setAuthOpen } = useAppStore();

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <div className="text-xl font-semibold mb-4">我的书架</div>

      {!user ? (
        <div className="rounded-xl border border-gray-200 bg-white/60 p-6">
          <div className="mb-3 text-gray-600">
            登录后可查看你的收藏书籍。
          </div>
          <button
            onClick={() => setAuthOpen(true)}
            className="inline-flex items-center rounded-lg bg-black px-4 py-2 text-white hover:opacity-90"
          >
            去登录
          </button>
        </div>
      ) : (
        <BookshelfSection />
      )}
    </div>
  );
}
