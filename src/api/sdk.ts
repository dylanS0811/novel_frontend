// src/api/sdk.ts
import http from './http';

// ---------------- 公共类型 ----------------
export interface User {
  id: number;
  nick: string;
  avatar: string;
  phone?: string; // 适配后端可能返回手机号
}

export interface BookSummary {
  id: number;
  title: string;
  author?: string;
  orientation?: string;
  category?: string;
  blurb?: string;
  tags?: string[];
  likes?: number;
  bookmarks?: number;
  comments?: number;
  createdAt?: string | number;
  recommender?: { id: number; nick: string; avatar?: string };
}

export interface CommentItem {
  id: number;
  userId: number;
  nick: string;
  userAvatar?: string;
  text: string;
  createdAt: string | number;
  likes?: number;
  liked?: boolean;
  parentId?: number | null;
  replies?: CommentItem[];
}

// --------------- Auth --------------------
export const authApi = {
  register: (payload: { handle: string; nick: string; password: string }) =>
    http.post<{ ok: boolean }>('/api/auth/register', payload),
  login: (payload: { handle: string; password: string }) =>
    http.post<{ token: string; user: User }>('/api/auth/login', payload),
};

// --------------- Me ----------------------
export const meApi = {
  get: () => http.get<User>('/api/me'),
  patch: (payload: { nickname?: string; avatar?: string; avatarUrl?: string }) =>
    http.patch<User>('/api/me', payload),
  checkNickname: (nickname: string) =>
    http.get<{ exists: boolean }>('/api/users/check-nickname', {
      params: { nickname },
    }),
};

// --------------- Uploads -----------------
export const uploadApi = {
  /** 上传头像文件，返回 URL */
  avatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return http.post<{ url: string }>('/api/uploads/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// --------------- Books -------------------
export type BooksQuery = {
  tab?: 'hot' | 'new';
  category?: string;
  orientation?: string;
  search?: string;
  tag?: string;
  page?: number;
  size?: number;
};

export const bookApi = {
  list: (params: BooksQuery) =>
    http.get<{
      list: BookSummary[];
      page: number;
      size: number;
      total: number;
    }>('/api/books', { params }),

  detail: (id: number) => http.get<BookSummary>(`/api/books/${id}`),

  create: (payload: {
    title: string;
    author?: string;
    orientation: string;
    category: string;
    blurb?: string;
    summary?: string;
    tags?: string[];
    recommenderId?: number;
  }) => http.post<BookSummary>('/api/books', payload),

  checkExist: (payload: { title: string; author?: string }) =>
    http.get<{ exists: boolean }>('/api/books/check', { params: payload }),

  patch: (id: number, payload: Partial<Omit<BookSummary, 'id'>>) =>
    http.patch<BookSummary>(`/api/books/${id}`, payload),

  delete: (id: number, userId: number) =>
    http.delete(`/api/books/${id}`, { params: { userId } }),

  like: (id: number, userId: number) =>
    http.post<{ liked: boolean; likes: number }>(`/api/books/${id}/likes`, null, {
      params: { userId },
    }),
  unlike: (id: number, userId: number) =>
    http.delete<{ liked: boolean; likes: number }>(
      `/api/books/${id}/likes`,
      { params: { userId } },
    ),

  bookmark: (id: number, userId: number) =>
    http.post<{ bookmarked: boolean; bookmarks: number }>(
      `/api/books/${id}/bookmarks`,
      null,
      { params: { userId } },
    ),
  unbookmark: (id: number, userId: number) =>
    http.delete<{ bookmarked: boolean; bookmarks: number }>(
      `/api/books/${id}/bookmarks`,
      { params: { userId } },
    ),

  comments: (id: number, page = 1, size = 20, userId?: number) =>
    http.get<{
      list: CommentItem[];
      page: number;
      size: number;
      total: number;
    }>(`/api/books/${id}/comments`, { params: { userId, page, size } }),

  addComment: (id: number, payload: { text: string; userId: number; parentId?: number }) =>
    http.post<CommentItem>(`/api/books/${id}/comments`, payload),

  likeComment: (id: number, userId: number) =>
    http.post<CommentItem>(`/api/comments/${id}/likes`, null, {
      params: { userId },
    }),
  unlikeComment: (id: number, userId: number) =>
    http.delete<CommentItem>(`/api/comments/${id}/likes`, {
      params: { userId },
    }),

  /** ===== 新增：按用户取“我点过赞/我收藏过”的书 ID 列表 ===== */
  userLikes: (userId: number) =>
    http.get<{ ids: number[] } | number[]>('/api/books/likes', { params: { userId } }),
  userBookmarks: (userId: number) =>
    http.get<{ ids: number[] } | number[]>('/api/books/bookmarks', { params: { userId } }),
};

// --------------- BookSheets --------------
export interface SheetItem {
  id: number;
  name: string;
  bookCount?: number;
  updatedAt?: string | number;
}

export interface SheetBook {
  id: number;
  title: string;
  author?: string;
  orientation?: string;
  category?: string;
  rating?: number;
  review?: string;
  createdAt?: string | number;
}

export const sheetApi = {
  list: (userId: number) =>
    http.get<{ list: SheetItem[] }>(`/api/users/${userId}/sheets`),
  create: (userId: number, payload: { name: string }) =>
    http.post<SheetItem>(`/api/users/${userId}/sheets`, payload),
  update: (id: number, payload: { name: string }) =>
    http.patch<SheetItem>(`/api/sheets/${id}`, payload),
  delete: (id: number) => http.delete<void>(`/api/sheets/${id}`),
  books: (sheetId: number) =>
    http.get<{ list: SheetBook[] }>(`/api/sheets/${sheetId}/books`),
  addBook: (
    sheetId: number,
    payload: Omit<SheetBook, 'id' | 'createdAt'>,
  ) => http.post<SheetBook>(`/api/sheets/${sheetId}/books`, payload),
  updateBook: (
    sheetId: number,
    bookId: number,
    payload: Partial<Omit<SheetBook, 'id' | 'createdAt'>>,
  ) => http.patch<SheetBook>(`/api/sheets/${sheetId}/books/${bookId}`, payload),
  removeBook: (sheetId: number, bookId: number) =>
    http.delete<void>(`/api/sheets/${sheetId}/books/${bookId}`),
  moveBook: (fromId: number, bookId: number, toId: number) =>
    http.post<{ moved: boolean; fromListId: number; toListId: number; bookId: number }>(
      `/api/sheets/${fromId}/books/${bookId}/move`,
      { toListId: toId },
    ),
};

// --------------- Tags --------------------
export const tagApi = {
  suggest: (q: string) =>
    http.get<string[]>('/api/tags/suggest', { params: { q } }),
  create: (payload: { name: string }) =>
    http.post<{ id: number; name: string }>('/api/tags', payload),
};

// --------------- Leaderboard -------------
export const leaderboardApi = {
  get: (params: { type?: 'champion' | 'rookie'; limit?: number }) =>
    http.get<{ list: BookSummary[] }>('/api/leaderboard', { params }),
};

// --------------- Notifications -----------
export interface NotificationItem {
  id: number;
  /**
   * 通知类型：
   * like(书被赞) / comment(书被评) / bookmark(书被收藏)
   * reply(评论被回复) / comment_like(评论被赞)
   * mention(@提及) / achievement(成就/榜单) / system(系统消息)
   */
  type: string;
  /** 主文案 */
  title: string;
  /** 额外说明，如评论内容摘要 */
  content?: string;
  read: boolean;
  createdAt: string | number;
  /** 触发者 */
  actor?: { id: number; nick: string; avatar?: string };
  /** 关联书籍/评论 ID */
  bookId?: number;
  bookTitle?: string;
  commentId?: number;
}

export const notificationApi = {
  list: (params: { userId: number; page?: number; size?: number }) =>
    http.get<{
      list: NotificationItem[];
      page: number;
      size: number;
      total: number;
    }>('/api/notifications', { params }),

  readAll: (userId: number) =>
    http.post<void>('/api/notifications/read-all', null, { params: { userId } }),

  readOne: (id: number, userId: number) =>
    http.post<void>(`/api/notifications/${id}/read`, null, { params: { userId } }),
};
