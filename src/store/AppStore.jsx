// src/store/AppStore.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, meApi, bookApi, notificationApi, sheetApi } from "../api/sdk";

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
  // 如果后端已返回树形结构，直接排序后返回
  if (list.some((c) => Array.isArray(c.replies) && c.replies.length > 0)) {
    return sortComments(list);
  }
  // 否则根据 parentId 构建树
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

function findCommentDepth(arr = [], targetId, depth = 0) {
  const tid = Number(targetId);
  for (const c of arr) {
    if (Number(c.id) === tid) return depth;
    if (c.replies) {
      const d = findCommentDepth(c.replies, tid, depth + 1);
      if (d !== -1) return d;
    }
  }
  return -1;
}

// 后端通知类型 -> 前端类型映射 & 规范化
const NOTIFICATION_TYPE_MAP = {
  BOOK_LIKED: "like",
  BOOK_BOOKMARKED: "bookmark",
  BOOK_COMMENTED: "comment",
  COMMENT_REPLIED: "reply",
  COMMENT_LIKED: "comment_like",
  BOOK_MENTIONED: "mention",
  SYSTEM: "system",
  ACHIEVEMENT_UNLOCKED: "achievement",
};

function normalizeNotification(n = {}) {
  return {
    ...n,
    type: NOTIFICATION_TYPE_MAP[n.type] || n.type?.toLowerCase(),
    bookTitle: n.bookTitle || n.title,
  };
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
  const [editingBook, setEditingBook] = useState(null);
  const [fabHidden, setFabHidden] = useState(false);

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

  // 个人书单
  const [sheets, setSheets] = useState([]);
  const [sheetBooks, setSheetBooks] = useState([]);
  const [activeSheetId, setActiveSheetId] = useState(null);

  // 用户名/邮箱/手机号 + 密码 登录
  const loginWithCredentials = async (handle, password) => {
    try {
      const res = await authApi.login({ handle, password });
      const d = res?.data || res || {};
      if (d.token) localStorage.setItem("token", d.token);
      const u = d.user || {};
      const mapped = {
        id: u.id ?? 1,
        nick: u.nick ?? u.name ?? u.nickname ?? nick ?? "新用户",
        avatar: u.avatar ?? "https://i.pravatar.cc/80?img=15",
      };
      setUser(mapped);
      localStorage.setItem("user", JSON.stringify(mapped));
      if (mapped.nick) setNick(mapped.nick);
      if (mapped.avatar) setAvatar(mapped.avatar);
      setAuthOpen(false);
    } catch (e) {
      console.error("credential login failed", e);
      throw e;
    }
  };

  // 注册账号
  const registerAccount = async (handle, nick, password) => {
    try {
      await authApi.register({ handle, nick, password });
    } catch (e) {
      console.error("register failed", e);
      throw e;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setLikedIds(new Set());
    setSavedIds(new Set());
    localStorage.removeItem("user");
  };

  // ===== 个人书单 =====
  const loadSheets = async () => {
    if (!user?.id) return;
    try {
      const res = await sheetApi.list(user.id);
      // 兼容多种返回结构：数组 / {list: [...]} / AxiosResponse
      const data = res?.data ?? res ?? [];
      const list = Array.isArray(data) ? data : data.list ?? [];
      setSheets(list);
      if (list.length && !activeSheetId) setActiveSheetId(list[0].id);
      localStorage.setItem(`sheets_${user.id}`, JSON.stringify(list));
    } catch (e) {
      console.error("load sheets failed", e);
      const cached = localStorage.getItem(`sheets_${user.id}`);
      if (cached) {
        try {
          const list = JSON.parse(cached);
          setSheets(list);
          if (list.length && !activeSheetId) setActiveSheetId(list[0].id);
        } catch {}
      }
    }
  };

  const loadSheetBooks = async (sheetId) => {
    if (!sheetId) return;
    try {
      const res = await sheetApi.books(sheetId);
      const data = res?.data ?? res ?? [];
      const list = Array.isArray(data) ? data : data.list ?? [];
      setSheetBooks(list);
      if (user?.id)
        localStorage.setItem(
          `sheetBooks_${user.id}_${sheetId}`,
          JSON.stringify(list)
        );
    } catch (e) {
      console.error("load sheet books failed", e);
      if (user?.id) {
        const cached = localStorage.getItem(
          `sheetBooks_${user.id}_${sheetId}`
        );
        if (cached) {
          try {
            setSheetBooks(JSON.parse(cached));
          } catch {}
        }
      }
    }
  };

  useEffect(() => {
    loadSheets();
  }, [user?.id]);

  useEffect(() => {
    if (activeSheetId) loadSheetBooks(activeSheetId);
  }, [activeSheetId]);

  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(`sheets_${user.id}`, JSON.stringify(sheets));
  }, [sheets, user?.id]);

  useEffect(() => {
    if (!user?.id || !activeSheetId) return;
    localStorage.setItem(
      `sheetBooks_${user.id}_${activeSheetId}`,
      JSON.stringify(sheetBooks)
    );
  }, [sheetBooks, user?.id, activeSheetId]);

  const addSheet = async (name) => {
    if (!user?.id) {
      setAuthOpen(true);
      return;
    }
    try {
      const res = await sheetApi.create(user.id, { name });
      const s = res?.data || res;
      setSheets((prev) => [...prev, s]);
    } catch (e) {
      console.error("add sheet failed", e);
    }
  };

  const renameSheet = async (id, name) => {
    try {
      const res = await sheetApi.update(id, { name });
      const s = res?.data || res;
      setSheets((prev) => prev.map((x) => (x.id === id ? { ...x, ...s } : x)));
    } catch (e) {
      console.error("rename sheet failed", e);
    }
  };

  const removeSheet = async (id) => {
    try {
      await sheetApi.delete(id);
      setSheets((prev) => prev.filter((x) => x.id !== id));
      if (id === activeSheetId) {
        setActiveSheetId(null);
        setSheetBooks([]);
      }
    } catch (e) {
      console.error("remove sheet failed", e);
    }
  };

  const addBookToSheet = async (sheetId, payload) => {
    if (!user?.id) {
      setAuthOpen(true);
      return;
    }
    try {
      const res = await sheetApi.addBook(sheetId, payload);
      const b = res?.data || res;
      if (sheetId === activeSheetId) setSheetBooks((prev) => [...prev, b]);
    } catch (e) {
      console.error("add book to sheet failed", e);
    }
  };

  const updateBookInSheet = async (sheetId, bookId, payload) => {
    if (!user?.id) {
      setAuthOpen(true);
      return;
    }
    try {
      const res = await sheetApi.updateBook(sheetId, bookId, payload);
      const b = res?.data || res;
      if (sheetId === activeSheetId)
        setSheetBooks((prev) => prev.map((x) => (x.id === b.id ? b : x)));
    } catch (e) {
      console.error("update book in sheet failed", e);
    }
  };

  const removeBookFromSheet = async (sheetId, bookId) => {
    if (!user?.id) {
      setAuthOpen(true);
      return;
    }
    try {
      await sheetApi.removeBook(sheetId, bookId);
      if (sheetId === activeSheetId)
        setSheetBooks((prev) => prev.filter((x) => x.id !== bookId));
    } catch (e) {
      console.error("remove book from sheet failed", e);
    }
  };

  const moveBookToSheet = async (fromId, book, toId) => {
    if (!user?.id) {
      setAuthOpen(true);
      throw new Error("not logged in");
    }
    try {
      await sheetApi.moveBook(fromId, book.id, toId);
      if (fromId === activeSheetId)
        setSheetBooks((prev) => prev.filter((x) => x.id !== book.id));
      if (toId === activeSheetId)
        setSheetBooks((prev) => [...prev, book]);
    } catch (e) {
      console.error("move book to sheet failed", e);
      throw e;
    }
  };

  // ===== 通知中心 =====
  const [notifications, setNotifications] = useState([]);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const addNotification = (n) =>
    setNotifications((arr) => [
      {
        id: n.id ?? "n" + Math.random().toString(36).slice(2),
        read: n.read ?? false,
        ...n,
      },
      ...arr,
    ]);

  const markNotificationRead = async (id) => {
    try {
      if (user?.id && typeof id === "number") {
        await notificationApi.readOne(id, user.id);
      }
    } catch (e) {
      console.error("mark notification read failed", e);
    } finally {
      setNotifications((arr) =>
        arr.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

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

  // 点赞/取消点赞（未登录：弹登录；已登录：打后端；带防重锁）
  const toggleLike = async (id) => {
    if (likeInflight.has(id)) return;
    likeInflight.add(id);

    const liked = likedIds.has(Number(id)) || likedIds.has(String(id));
    try {
      if (!user?.id) {
        setAuthOpen(true);
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

  // 收藏/取消收藏（未登录：弹登录；已登录：打后端；带防重锁）
  const toggleSave = async (id) => {
    if (bookmarkInflight.has(id)) return;
    bookmarkInflight.add(id);

    const bookmarked = savedIds.has(Number(id)) || savedIds.has(String(id));
    try {
      if (!user?.id) {
        setAuthOpen(true);
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
    if (!user?.id) {
      setAuthOpen(true);
      throw new Error("not logged in");
    }
    const pid = parentId != null ? Number(parentId) : null;
    if (pid) {
      const depth = findCommentDepth(commentsMap[Number(bookId)] || [], pid);
      if (depth >= 2) {
        alert("最多只能回复到第3层");
        return;
      }
    }
    try {
      const payload = { text, userId: user.id };
      if (pid) payload.parentId = pid;
      const c = await bookApi.addComment(Number(bookId), payload);
      const created =
        c?.data ||
        c || {
          id: Date.now(),
          nick,
          userAvatar: avatar || "https://i.pravatar.cc/80?img=15",
          text,
          createdAt: new Date().toISOString(),
          likes: 0,
          parentId: pid ?? null,
        };
      setCommentsMap((m) => {
        const next = { ...m };
        const key = Number(bookId);
        const list = next[key] ? [...next[key]] : [];
        if (pid) {
          const insert = (arr) =>
            arr.map((item) => {
              if (Number(item.id) === pid) {
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

  const toggleCommentLike = async (commentId) => {
    const bookId = commentsOpen?.item?.id;
    if (!bookId) return;
    const key = Number(bookId);
    const list = commentsMap[key] || [];
    const find = (arr) => {
      for (const it of arr) {
        if (it.id === commentId) return it;
        if (it.replies) {
          const r = find(it.replies);
          if (r) return r;
        }
      }
      return null;
    };
    const target = find(list);
    if (!target) return;
    if (!user?.id) {
      setAuthOpen(true);
      return;
    }
    const liked = target.liked;
    const inc = liked ? -1 : 1;

    // Optimistic update
    setCommentsMap((m) => {
      const replace = (arr) =>
        arr.map((item) => {
          if (item.id === commentId) {
            return {
              ...item,
              liked: !liked,
              likes: Math.max(0, Number(item.likes || 0) + inc),
            };
          }
          if (item.replies) return { ...item, replies: replace(item.replies) };
          return item;
        });
      return { ...m, [key]: replace(m[key] || []) };
    });

    try {
      const res = liked
        ? await bookApi.unlikeComment(commentId, user.id)
        : await bookApi.likeComment(commentId, user.id);
      const updated = res?.data || res || {};
      setCommentsMap((m) => {
        const replace = (arr) =>
          sortComments(
            arr.map((item) => {
              if (item.id === commentId) {
                return { ...item, ...updated };
              }
              if (item.replies) return { ...item, replies: replace(item.replies) };
              return item;
            })
          );
        return { ...m, [key]: replace(m[key] || []) };
      });
    } catch (e) {
      // Revert optimistic update on failure
      setCommentsMap((m) => {
        const replace = (arr) =>
          arr.map((item) => {
            if (item.id === commentId) {
              return {
                ...item,
                liked,
                likes: Math.max(0, Number(item.likes || 0) - inc),
              };
            }
            if (item.replies) return { ...item, replies: replace(item.replies) };
            return item;
          });
        return { ...m, [key]: replace(m[key] || []) };
      });
      console.error("toggle comment like failed", e);
    }
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
    const cached = localStorage.getItem("user");
    if (cached) {
      try {
        const u = JSON.parse(cached);
        if (u.nick || u.name || u.nickname) setNick(u.nick || u.name || u.nickname);
        if (u.avatar) setAvatar(u.avatar);
        setUser(u);
      } catch {}
    }
    let mounted = true;
    (async () => {
      try {
        const r = await meApi.get();
        const d = r?.data || r || {};
        if (!mounted) return;
        if (d.nick || d.name || d.nickname) setNick(d.nick || d.name || d.nickname);
        if (d.avatar) setAvatar(d.avatar);
        if (d.id)
          setUser({
            id: d.id,
            nick: d.nick ?? d.name ?? d.nickname ?? nick,
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

  // 监听全局未授权事件：清空本地登录状态并弹出登录框
  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setLikedIds(new Set());
      setSavedIds(new Set());
      setAuthOpen(true);
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
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
        const res = await bookApi.comments(
          Number(bookId),
          1,
          30,
          user?.id
        );
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
  }, [commentsOpen.open, commentsOpen.item, user]);

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
        const mapped = list.map(normalizeNotification);
        if (!aborted) setNotifications(mapped);
      } catch (e) {
        console.error("load notifications failed", e);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [user?.id]);

  // 打开通知中心时刷新，确保外部互动后能获取最新通知
  useEffect(() => {
    if (!notifyOpen || !user?.id) return;
    let aborted = false;
    (async () => {
      try {
        const res = await notificationApi.list({ userId: user.id, page: 1, size: 20 });
        const data = res?.data || res || {};
        const list = data.list ?? data.items ?? [];
        const mapped = list.map(normalizeNotification);
        if (!aborted) setNotifications(mapped);
      } catch (e) {
        console.error("load notifications failed", e);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [notifyOpen, user?.id]);

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
      editingBook,
      setEditingBook,
      fabHidden,
      setFabHidden,

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
      loginWithCredentials,
      registerAccount,
      logout,

      // 个人书单
      sheets,
      sheetBooks,
      activeSheetId,
      setActiveSheetId,
      loadSheets,
      loadSheetBooks,
      addSheet,
      renameSheet,
      removeSheet,
      addBookToSheet,
      updateBookInSheet,
      removeBookFromSheet,
      moveBookToSheet,

      // 通知
      notifications,
      notifyOpen,
      setNotifyOpen,
      addNotification,
      markNotificationRead,
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
      sheets,
      sheetBooks,
      activeSheetId,
      notifications,
      notifyOpen,
      unreadCount,
      moveBookToSheet,
      editingBook,
      fabHidden,
    ]
  );

  return <AppCtx.Provider value={store}>{children}</AppCtx.Provider>;
}

export const useAppStore = () => useContext(AppCtx);
