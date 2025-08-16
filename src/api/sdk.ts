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
  coverUrl?: string;
  tags?: string[];
  likes?: number;
  bookmarks?: number;
  comments?: number;
  createdAt?: string | number;
  recommender?: { id: number; name: string; avatar?: string };
}

export interface CommentItem {
  id: number;
  userId: number;
  userName: string;
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
  // 发送短信验证码
  sendPhoneCode: (payload: { phone: string }) =>
    http.post<{ sent: boolean; ttl: number }>('/api/auth/phone/code', payload),

  wechatLogin: (payload: { wechatCode: string }) =>
    http.post<{ token: string; user: User }>('/api/auth/wechat/login', payload),
  phoneLogin: (payload: { phone: string; code: string }) =>
    http.post<{ token: string; user: User }>('/api/auth/phone/login', payload),
};

// --------------- Me ----------------------
export const meApi = {
  get: () => http.get<User>('/api/me'),
  patch: (payload: { nickname?: string; avatar?: string }) =>
    http.patch<User>('/api/me', payload),
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
    coverUrl?: string;
    recommenderId?: number;
  }) => http.post<BookSummary>('/api/books', payload),

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

  comments: (id: number, page = 1, size = 20) =>
    http.get<{
      list: CommentItem[];
      page: number;
      size: number;
      total: number;
    }>(`/api/books/${id}/comments`, { params: { page, size } }),

  addComment: (id: number, payload: { text: string; userId: number; parentId?: number }) =>
    http.post<CommentItem>(`/api/books/${id}/comments`, payload),

  /** ===== 新增：按用户取“我点过赞/我收藏过”的书 ID 列表 ===== */
  userLikes: (userId: number) =>
    http.get<{ ids: number[] } | number[]>('/api/books/likes', { params: { userId } }),
  userBookmarks: (userId: number) =>
    http.get<{ ids: number[] } | number[]>('/api/books/bookmarks', { params: { userId } }),
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
  title: string;
  content: string;
  read: boolean;
  createdAt: string | number;
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
