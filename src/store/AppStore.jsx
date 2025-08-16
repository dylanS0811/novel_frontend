// src/store/AppStore.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, meApi, bookApi, notificationApi } from "../api/sdk";

const AppCtx = createContext(null);

// —— 全局防重锁 —— //
const likeInflight = new Set();
const bookmarkInflight = new Set();

// 首页筛选默认值
const DEFAULTS = { tab: "new", category: "全部", orientation: "全部", search: "" };

// 工具：从 /api/likes /api/bookmarks 响应中稳健提取 ids 数组（兼容 {data:{ids}}, {ids}, 纯数组）
function extractIds(resp) {
  if (!resp) return [];
  const root = resp.data != null ? resp.data : resp; // 兼容 axios 拦截器
  if (!root) return [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root.ids)) return root.ids;
  if (root.list && Array.isArray(root.list)) return root.list;
  return [];
}

function sortComments(arr = []) {
  return arr
    .map((c) => ({ ...c, replies: sortComments(c.replies || []) }))
    .sort(
      (a, b) =>
        (b.likes || 0) - (a.likes || 0) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

function buildCommentTree(list = []) {
  const map = {};
  list.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });
  const roots = [];
  list.forEach((c) => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return sortComments(roots);
}

export function AppProvider({ children }) {
  const [nick, setNick] = useState("一颗麦穗");
  const [avatar, setAvatar] = useState("");

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);

  // ✅ 用户维度的“我已点赞/收藏”集合
  const [likedIds, setLikedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());

  const [showUpload, setShowUpload] = useState(false);
  const [detail, setDetail] = useState(null);
  const [commentsOpen, setCommentsOpen] = useState({ open: false, item: null });
  const [commentsMap, setCommentsMap] = useState({});

  const [tab, setTab] = useState(DEFAULTS.tab);
  const [category, setCategory] = useState(DEFAULTS.category);
  const [orientation, setOrientation] = useState(DEFAULTS.orientation);
  const [search, setSearch] = useState(DEFAULTS.search);
  const resetFilters = () => {
    setTab(DEFAULTS.tab);
    setCategory(DEFAULTS.category);
    setOrientation(DEFAULTS.orientation);
    setSearch(DEFAULTS.search);
    setPage(1);
  };

  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  // 发送短信验证码
  const sendPhoneCode = async (phone) => {
    await authApi.sendPhoneCode({ phone });
  };

  // 微信登录
  const loginWithWeChat = async (wechatCode = "example_code") => {
    try {
      const res = await authApi.wechatLogin({ wechatCode });
      const d = res?.data || res || {};
      if (d.token) localStorage.setItem("token", d.token);
      const u = d.user || {};
      const mapped = {
        id: u.id ?? 1,
        nick: u.nick ?? nick ?? "新用户",
        avatar: u.avatar ?? "https://i.pravatar.cc/80?img=15",
      };
      setUser(mapped);
      if (mapped.nick) setNick(mapped.nick);
      if (mapped.avatar) setAvatar(mapped.avatar);
      setAuthOpen(false);
    } catch (e) {
      console.error("wechat login failed", e);
    }
  };

  // 手机号登录
  const loginWithPhone = async (phone = "13800000000", code = "1234") => {
    try {
      const res = await authApi.phoneLogin({ phone, code });
      const d = res?.data || res || {};
      if (d.token) localStorage.setItem("token", d.token);
      const u = d.user || {};
      const mapped = {
        id: u.id ?? 1,
        nick: u.nick ?? nick ?? "新用户",
        avatar: u.avatar ?? "https://i.pravatar.cc/80?img=11",
        phone: u.phone ?? phone,
      };
      setUser(mapped);
      if (mapped.nick) setNick(mapped.nick);
      if (mapped.avatar) setAvatar(mapped.avatar);
      setAuthOpen(false);
    } catch (e) {
      console.error("phone login failed", e);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setLikedIds(new Set());
    setSavedIds(new Set());
  };

  // ===== 通知中心 =====
  const [notifications, setNotifications] = useState([]);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const addNotification = (n) =>
    setNotifications((arr) => [
      { id: "n" + Math.random().toString(36).slice(2), read: false, ...n },
      ...arr,
    ]);

  const markAllRead = async () => {
    try {
      if (user?.id) await notificationApi.readAll(user.id);
    } finally {
      setNotifications((arr) => arr.map((n) => ({ ...n, read: true })));
    }
  };

  const removeNotification = (id) =>
    setNotifications((arr) => arr.filter((n) => n.id !== id));
  const clearNotifications = () => setNotifications([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ================== 点赞 / 收藏 ================== */

  // 点赞/取消点赞（未登录：本地集合；已登录：打后端；带防重锁）
  const toggleLike = async (id) => {
    if (likeInflight.has(id)) return;
    likeInflight.add(id);

    const liked = likedIds.has(Number(id)) || likedIds.has(String(id));
    try {
      if (!user?.id) {
        setLikedIds((prev) => {
          const n = new Set(prev);
          if (liked) { n.delete(Number(id)); n.delete(String(id)); }
          else { n.add(Number(id)); }
          return n;
        });
        return;
      }
      if (!liked) await bookApi.like(Number(id), user.id);
      else await bookApi.unlike(Number(id), user.id);
      setLikedIds((prev) => {
        const n = new Set(prev);
        if (liked) { n.delete(Number(id)); n.delete(String(id)); }
        else { n.add(Number(id)); }
        return n;
      });
    } catch (e) {
      console.error("toggleLike failed", e);
    } finally {
      likeInflight.delete(id);
    }
  };

  // 收藏/取消收藏（未登录：本地集合；已登录：打后端；带防重锁）
  const toggleSave = async (id) => {
    if (bookmarkInflight.has(id)) return;
    bookmarkInflight.add(id);

    const bookmarked = savedIds.has(Number(id)) || savedIds.has(String(id));
    try {
      if (!user?.id) {
        setSavedIds((prev) => {
          const n = new Set(prev);
          if (bookmarked) { n.delete(Number(id)); n.delete(String(id)); }
          else { n.add(Number(id)); }
          return n;
        });
        return;
      }
      if (!bookmarked) await bookApi.bookmark(Number(id), user.id);
      else await bookApi.unbookmark(Number(id), user.id);
      setSavedIds((prev) => {
        const n = new Set(prev);
        if (bookmarked) { n.delete(Number(id)); n.delete(String(id)); }
        else { n.add(Number(id)); }
        return n;
      });
    } catch (e) {
      console.error("toggleSave failed", e);
    } finally {
      bookmarkInflight.delete(id);
    }
  };

  // 发表评论或回复
  const addComment = async (text, parentId) => {
    const bookId = commentsOpen?.item?.id;
    if (!bookId) return;
    try {
      const payload = { text, userId: user?.id ?? 1 };
      if (parentId) payload.parentId = parentId;
      const c = await bookApi.addComment(Number(bookId), payload);
      const created =
        c?.data ||
        c || {
          id: Date.now(),
          userName: nick,
          userAvatar: avatar || "https://i.pravatar.cc/80?img=15",
          text,
          createdAt: new Date().toISOString(),
          likes: 0,
          parentId: parentId ?? null,
        };
      setCommentsMap((m) => {
        const next = { ...m };
        const key = Number(bookId);
        const list = next[key] ? [...next[key]] : [];
        if (parentId) {
          const insert = (arr) =>
            arr.map((item) => {
              if (item.id === parentId) {
                return {
                  ...item,
                  replies: sortComments([...(item.replies || []), created]),
                };
              }
              if (item.replies)
                return { ...item, replies: insert(item.replies) };
              return item;
            });
          next[key] = insert(list);
        } else {
          next[key] = sortComments([...list, { ...created, replies: [] }]);
        }
        return next;
      });
    } catch (e) {
      console.error("addComment failed", e);
    }
  };

  const toggleCommentLike = (commentId) => {
    const bookId = commentsOpen?.item?.id;
    if (!bookId) return;
    setCommentsMap((m) => {
      const key = Number(bookId);
      const update = (arr) =>
        sortComments(
          arr.map((item) => {
            if (item.id === commentId) {
              const liked = item.liked;
              return {
                ...item,
                liked: !liked,
                likes: (item.likes || 0) + (liked ? -1 : 1),
              };
            }
            if (item.replies)
              return { ...item, replies: update(item.replies) };
            return item;
          })
        );
      return { ...m, [key]: update(m[key] || []) };
    });
  };

  // 拉列表
  const loadBooks = async () => {
    setLoadingList(true);
    try {
      const res = await bookApi.list({
        tab,
        category: category === "全部" ? undefined : category,
        orientation: orientation === "全部" ? undefined : orientation,
        search: search || undefined,
        page,
        size,
      });
      const data = res?.data || res || {};
      const list = data.list ?? data.items ?? [];
      setItems(list);
      setTotal(data.total ?? list.length ?? 0);
    } catch (e) {
      console.error("load books failed", e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoadingList(false);
    }
  };

  // 启动：有 token 才读 /api/me
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    let mounted = true;
    (async () => {
      try {
        const r = await meApi.get();
        const d = r?.data || r || {};
        if (!mounted) return;
        if (d.nick) setNick(d.nick);
        if (d.avatar) setAvatar(d.avatar);
        if (d.id)
          setUser({
            id: d.id,
            nick: d.nick ?? nick,
            avatar: d.avatar ?? avatar,
            phone: d.phone,
          });
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 筛选/分页变化时刷新
  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoadingList(true);
      try {
        const res = await bookApi.list({
          tab,
          category: category === "全部" ? undefined : category,
          orientation: orientation === "全部" ? undefined : orientation,
          search: search || undefined,
          page,
          size,
        });
        const data = res?.data || res || {};
        const list = data.list ?? data.items ?? [];
        if (!aborted) {
          setItems(list);
          setTotal(data.total ?? list.length ?? 0);
        }
      } catch (e) {
        console.error("load books failed", e);
        if (!aborted) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!aborted) setLoadingList(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [tab, category, orientation, search, page, size]);

  // 打开评论抽屉时拉评论
  useEffect(() => {
    const bookId = commentsOpen?.item?.id;
    if (!commentsOpen.open || !bookId) return;
    let aborted = false;
    (async () => {
      try {
        const res = await bookApi.comments(Number(bookId), 1, 30);
        const data = res?.data || res || {};
        const list = data.list ?? data.items ?? [];
        const tree = buildCommentTree(list);
        if (!aborted) setCommentsMap((m) => ({ ...m, [Number(bookId)]: tree }));
      } catch (e) {
        console.error("load comments failed", e);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [commentsOpen.open, commentsOpen.item]);

  // 用户变化：拉我的点赞/收藏 → 初始化高亮
  useEffect(() => {
    if (!user?.id) {
      setLikedIds(new Set());
      setSavedIds(new Set());
      return;
    }
    let aborted = false;
    (async () => {
      try {
        const [lr, br] = await Promise.all([
          bookApi.userLikes(user.id),
          bookApi.userBookmarks(user.id),
        ]);
        const likesArr = extractIds(lr);
        const bmsArr = extractIds(br);

        // 规范化（去重、转 number）
        const norm = (arr) =>
          Array.isArray(arr)
            ? Array.from(new Set(arr.map((x) => Number(x)).filter((n) => Number.isFinite(n))))
            : [];

        if (aborted) return;
        setLikedIds(new Set(norm(likesArr)));
        setSavedIds(new Set(norm(bmsArr)));
      } catch (e) {
        console.error("load user likes/bookmarks failed", e);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [user?.id]);

  // 用户变化：拉通知
  useEffect(() => {
    if (!user?.id) return;
    let aborted = false;
    (async () => {
      try {
        const res = await notificationApi.list({ userId: user.id, page: 1, size: 20 });
        const data = res?.data || res || {};
        const list = data.list ?? data.items ?? [];
        if (!aborted) setNotifications(list);
      } catch (e) {
        console.error("load notifications failed", e);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [user?.id]);

  const store = useMemo(
    () => ({
      // 基础
      nick,
      setNick,
      avatar,
      setAvatar,

      items,
      setItems,
      page,
      setPage,
      size,
      total,
      loadingList,

      // ✅ 我已点赞/收藏
      likedIds,
      toggleLike,
      savedIds,
      toggleSave,

      // 弹层 & 详情/评论
      showUpload,
      setShowUpload,
      detail,
      setDetail,
      commentsOpen,
      setCommentsOpen,
      commentsMap,
      addComment,
      toggleCommentLike,

      // 筛选
      tab,
      setTab,
      category,
      setCategory,
      orientation,
      setOrientation,
      search,
      setSearch,
      resetFilters,

      // 登录
      user,
      setUser,
      authOpen,
      setAuthOpen,
      sendPhoneCode,
      loginWithWeChat,
      loginWithPhone,
      logout,

      // 通知
      notifications,
      notifyOpen,
      setNotifyOpen,
      addNotification,
      markAllRead,
      removeNotification,
      clearNotifications,
      unreadCount,

      // 列表刷新（对外暴露）
      loadBooks,
    }),
    [
      nick,
      avatar,
      items,
      page,
      size,
      total,
      loadingList,
      likedIds,
      savedIds,
      showUpload,
      detail,
      commentsOpen,
      commentsMap,
      tab,
      category,
      orientation,
      search,
      user,
      authOpen,
      notifications,
      notifyOpen,
      unreadCount,
    ]
  );

  return <AppCtx.Provider value={store}>{children}</AppCtx.Provider>;
}

export const useAppStore = () => useContext(AppCtx);
