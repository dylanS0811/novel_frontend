// src/pages/HomePage.jsx
// 首页：保持筛选条常显（不折叠）＋ 保持背景为浅粉→白色
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../store/AppStore";
import FilterBar from "../components/FilterBar";
import Leaderboard from "../components/Leaderboard";
import NovelCard from "../components/NovelCard";
import { THEME } from "../lib/theme";

// 用 hooks 拉取后端 /api/books
import { useBooks } from "../api/hooks";

export default function HomePage() {
  const nav = useNavigate();
  const qc = useQueryClient();

  // —— 防重复请求（点赞/收藏）——
  const likePending = React.useRef(new Set());
  const bookmarkPending = React.useRef(new Set());

  const {
    // 我已点赞/收藏（用于高亮 & 判断增减）
    likedIds, toggleLike,
    savedIds, toggleSave,

    // 评论
    setCommentsOpen,

    // 筛选（仍由全局 Store 管）
    tab, category, orientation, setCategory, setOrientation,
    search,

    // 分页
    page, size,
  } = useAppStore();

  // —— 拉取列表 —— //
  const { data: res, isLoading } = useBooks({
    tab,
    category: category === "全部" ? undefined : category,
    orientation: orientation === "全部" ? undefined : orientation,
    search: search || undefined,
    page,
    size,
  });

  // 兼容 axios 拦截器（可能把 {code,msg,data} 拍平）
  const data = res?.data || res || {};
  const viewItems = data.list ?? data.items ?? [];
  const total = data.total ?? viewItems.length ?? 0;

  // 兼容 id 字符串/数字的判断
  const hasId = (set, id) => set.has(id) || set.has(Number(id)) || set.has(String(id));

  /* ---------------- 乐观更新工具 ---------------- */
  const patchBooksCache = (id, updater) => {
    const entries = qc.getQueriesData({ queryKey: ["books"] }); // [[key, data], ...]
    entries.forEach(([key, old]) => {
      const d = old?.data || old;
      if (!d) return;
      const oldList = d.list ?? d.items ?? [];
      const newList = oldList.map((b) => (b.id === id ? updater({ ...b }) : b));
      const next = { ...d, list: newList, items: newList };
      qc.setQueryData(key, (prev) =>
        prev && "data" in (prev || {}) ? { ...prev, data: next } : next
      );
    });
  };

  const optimisticLike = (id, inc) =>
    patchBooksCache(id, (b) => {
      b.likes = Math.max(0, Number(b.likes || 0) + inc);
      return b;
    });

  const optimisticBookmark = (id, inc) =>
    patchBooksCache(id, (b) => {
      b.bookmarks = Math.max(0, Number(b.bookmarks || 0) + inc);
      return b;
    });

  /* ---------------- 交互回调 ---------------- */

  // 点赞/取消点赞（根据 likedIds 判断）
  const handleLike = async (item) => {
    if (likePending.current.has(item.id)) return;
    likePending.current.add(item.id);

    const likedNow = hasId(likedIds, item.id); // 当前是否已点赞
    const inc = likedNow ? -1 : +1;

    optimisticLike(item.id, inc);
    try {
      await toggleLike(item.id); // 内部会打后端并维护 likedIds
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    } catch (e) {
      optimisticLike(item.id, -inc); // 回滚
      throw e;
    } finally {
      likePending.current.delete(item.id);
    }
  };

  // 收藏/取消收藏（根据 savedIds 判断）
  const handleToggleSave = async (item) => {
    if (bookmarkPending.current.has(item.id)) return;
    bookmarkPending.current.add(item.id);

    const bookmarkedNow = hasId(savedIds, item.id);
    const inc = bookmarkedNow ? -1 : +1;

    optimisticBookmark(item.id, inc);
    try {
      await toggleSave(item.id); // 内部会打后端并维护 savedIds
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    } catch (e) {
      optimisticBookmark(item.id, -inc); // 回滚
      throw e;
    } finally {
      bookmarkPending.current.delete(item.id);
    }
  };

  return (
    <>
      {/* 非 sticky 的筛选条（保持常显、不折叠） */}
      <FilterBar
        category={category}
        setCategory={setCategory}
        orientation={orientation}
        setOrientation={setOrientation}
      />

      <main className="max-w-[1200px] mx-auto px-4 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 左侧：卡片 */}
        <div className="lg:col-span-9">
          <div className="mb-2 text-sm text-gray-600">
            当前：
            <b>{tab === "hot" ? "热榜（点赞降序）" : "新粮（时间倒序）"}</b>
            {category && category !== "全部" && <> · 类别：<b>{category}</b></>}
            {orientation && orientation !== "全部" && <> · 性向：<b>{orientation}</b></>}
            {search && <> · 搜索：<b>{search}</b></>}
            <span className="ml-2">共 {total} 条</span>
          </div>

          {isLoading ? (
            <div className="text-sm text-gray-500 py-8">加载中...</div>
          ) : viewItems.length === 0 ? (
            <div className="text-sm text-gray-500 py-8">
              暂无数据。你可以点击左上角“LOGO”回首页清空筛选，
              或检查来源数据是否缺少必填字段（title/category/orientation）。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {viewItems.map((item) => (
                <NovelCard
                  key={item.id || item.title}
                  item={item}
                  liked={hasId(likedIds, item.id)}            // ✅ 刷新后即可高亮
                  saved={hasId(savedIds, item.id)}            // ✅ 刷新后即可高亮
                  onLike={() => handleLike(item)}             // 再次点击即取消
                  onToggleSave={() => handleToggleSave(item)} // 再次点击即取消
                  onOpenDetail={() => nav(`/book/${encodeURIComponent(item.id)}`)}
                  onOpenComments={() => setCommentsOpen({ open: true, item })}
                  onOpenUser={(u) => nav(`/u/${encodeURIComponent(u.name)}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 右侧：排行榜（Top 10） */}
        <div className="lg:col-span-3 space-y-4">
          <Leaderboard
            items={viewItems}
            onOpenUser={(u) => nav(`/u/${encodeURIComponent(u.name)}`)}
          />
        </div>
      </main>

      <div className="text-center text-xs text-gray-500 py-8">
        <span style={{ color: THEME.orchid }}>
          小贴士：点击左上角“LOGO”会回首页并清空筛选，默认选中新粮。
        </span>
      </div>
    </>
  );
}
