// —— 用户
export interface Me {
  id: number;
  nickname: string;
  avatar: string;
}

// —— 书籍
export interface Book {
  id: number;
  title: string;
  author?: string;
  orientation: string;
  category: string;
  blurb?: string;
  summary?: string;
  tags: string[];
  coverUrl?: string;
  likes: number;
  bookmarks: number;
  comments: number;
  createdAt?: string; // 或 ISO
  recommender?: { id: number; name: string; avatar?: string };
}

// —— 评论
export interface Comment {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  likes?: number;
  liked?: boolean;
  parentId?: number | null;
  replies?: Comment[];
}

// —— 通知
export interface Notification {
  id: number;
  type: string;
  title: string;
  content?: string;
  read: boolean;
  createdAt: string;
}

// —— 排行榜
export interface LeaderboardItem {
  id: number;
  title: string;
  likes: number;
  bookmarks: number;
}

// —— 创建/更新 书籍 入参
export interface BookCreateReq {
  title: string;
  author?: string;
  orientation: string;
  category: string;
  blurb?: string;
  summary?: string;
  tags?: string[];
  coverUrl?: string;
  recommenderId?: number;
}
export type BookUpdateReq = Partial<Omit<BookCreateReq, 'recommenderId'>>;

// —— 评论入参
export interface CommentCreateReq {
  text: string;
  userId: number;
  parentId?: number | null;
}
