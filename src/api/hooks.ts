// src/api/hooks.ts
import {
  useMutation,
  useQuery,
  useQueryClient,
  QueryKey,
} from '@tanstack/react-query';
import {
  authApi,
  meApi,
  bookApi,
  tagApi,
  leaderboardApi,
  notificationApi,
} from './sdk';

/* ========== Auth ========== */

export const useAuthRegister = () =>
  useMutation({
    mutationFn: (payload: Parameters<typeof authApi.register>[0]) =>
      authApi.register(payload),
  });

export const useAuthLogin = () =>
  useMutation({
    mutationFn: (payload: Parameters<typeof authApi.login>[0]) =>
      authApi.login(payload),
  });

/* ========== Me ========== */

// 当前用户
export const useMe = () =>
  useQuery({
    queryKey: ['me'] as QueryKey,
    queryFn: () => meApi.get(),
  });

// 修改当前用户（昵称 / 头像）
export const usePatchMe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof meApi.patch>[0]) =>
      meApi.patch(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

/* ========== Books ========== */

// 列表
export const useBooks = (params: Parameters<typeof bookApi.list>[0]) =>
  useQuery({
    queryKey: ['books', params] as QueryKey,
    queryFn: () => bookApi.list(params),
    // 用上一页作为占位，避免切页抖动
    placeholderData: (prev) => prev,
  });

// 详情
export const useBook = ({ id }: { id?: number }) =>
  useQuery({
    queryKey: ['book', id] as QueryKey,
    queryFn: () => bookApi.detail(id as number),
    enabled: id != null,
  });

// 新建
export const useCreateBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof bookApi.create>[0]) =>
      bookApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['books'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

// 覆盖更新
export const useUpdateBook = (id?: number, userId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof bookApi.update>[2]) =>
      bookApi.update(id as number, userId as number, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book', id] });
      qc.invalidateQueries({ queryKey: ['books'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

// 更新
export const usePatchBook = (id?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof bookApi.patch>[1]) =>
      bookApi.patch(id as number, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book', id] });
      qc.invalidateQueries({ queryKey: ['books'] });
    },
  });
};

// 删除
export const useDeleteBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      userId,
    }: {
      id: number;
      userId: number;
    }) => bookApi.delete(id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['books'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

// 点赞/取消点赞
export const useLikeBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      userId,
      liked,
    }: {
      id: number;
      userId: number;
      liked: boolean;
    }) => (liked ? bookApi.unlike(id, userId) : bookApi.like(id, userId)),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['book', vars.id] });
      qc.invalidateQueries({ queryKey: ['books'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

// 收藏/取消收藏
export const useBookmarkBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      userId,
      bookmarked,
    }: {
      id: number;
      userId: number;
      bookmarked: boolean;
    }) =>
      bookmarked
        ? bookApi.unbookmark(id, userId)
        : bookApi.bookmark(id, userId),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['book', vars.id] });
      qc.invalidateQueries({ queryKey: ['books'] });
    },
  });
};

// 评论列表
export const useComments = ({
  id,
  userId,
  page = 1,
  size = 20,
}: {
  id?: number;
  userId?: number;
  page?: number;
  size?: number;
}) =>
  useQuery({
    queryKey: ['comments', id, userId, page, size] as QueryKey,
    queryFn: () => bookApi.comments(id as number, page, size, userId),
    enabled: id != null,
    placeholderData: (prev) => prev,
  });

// 新增评论
export const useAddComment = (id?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof bookApi.addComment>[1]) =>
      bookApi.addComment(id as number, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', id] });
      qc.invalidateQueries({ queryKey: ['book', id] });
      // 👉 新增：刷新首页/列表，评论数会跟着更新
      qc.invalidateQueries({ queryKey: ['books'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};


/* ========== Tags ========== */

// 远端标签 suggest
export const useTagSuggest = (q?: string) =>
  useQuery({
    queryKey: ['tag_suggest', q] as QueryKey,
    queryFn: () => tagApi.suggest(q as string),
    enabled: !!q && q.length > 0,
  });

// 新建标签
export const useCreateTag = () =>
  useMutation({
    mutationFn: (payload: Parameters<typeof tagApi.create>[0]) =>
      tagApi.create(payload),
  });

/* ========== Leaderboard ========== */

export const useLeaderboard = (
  params: Parameters<typeof leaderboardApi.get>[0]
) =>
  useQuery({
    queryKey: ['leaderboard', params] as QueryKey,
    queryFn: () => leaderboardApi.get(params),
  });

/* ========== Notifications ========== */

// 列表
export const useNotifications = (
  params: Parameters<typeof notificationApi.list>[0]
) =>
  useQuery({
    queryKey: ['notifications', params] as QueryKey,
    queryFn: () => notificationApi.list(params),
    enabled: !!params?.userId,
    placeholderData: (prev) => prev,
  });

// 全部已读
export const useReadAllNotifications = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => notificationApi.readAll(userId),
    onSuccess: (_res, userId) => {
      qc.invalidateQueries({ queryKey: ['notifications', { userId }] });
    },
  });
};

// 单条已读
export const useReadOneNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      userId,
    }: {
      id: number;
      userId: number;
    }) => notificationApi.readOne(id, userId),
    onSuccess: (_res, { userId }) => {
      qc.invalidateQueries({ queryKey: ['notifications', { userId }] });
    },
  });
};
