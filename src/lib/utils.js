// src/lib/utils.js
/**
 * 通用工具：classNames / 热度算法 / 日期格式化 / 排行聚合 / 安全辅助
 * 仅包含纯 JS（不含任何 JSX）
 */

/** Tailwind 类名拼接 */
export const classNames = (...arr) => arr.filter(Boolean).join(" ");

/**
 * 热度算法（统一口径）
 * 权重：评论×1、收藏×2、点赞×3
 */
export const heatScore = (item) => {
  const likes = Number(item?.likes || 0);
  const bookmarks = Number(item?.bookmarks || 0);
  const comments = Number(item?.comments || 0);
  return comments * 1 + bookmarks * 2 + likes * 3;
};

/** 安全数组：不是数组就返回空数组，避免 .map 报错 */
export const asArray = (v) => (Array.isArray(v) ? v : []);

/**
 * 更稳的时间格式化：YYYY-MM-DD HH:mm
 * - 缺失或非法时间返回 "未知"，避免渲染时报错
 */
export const formatDate = (ts) => {
  if (!ts) return "未知";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "未知";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

/**
 * 判定卡片是否可渲染的最小字段
 * - 避免单条坏数据拖垮整个列表渲染
 */
export const isValidItem = (it) =>
  !!(it && it.title && it.category && it.orientation);

/**
 * 聚合用户热度榜
 * @param {Array} items 书目数组
 * @param {"champion"|"rookie"} mode champion=历史累计；rookie=近 30 天
 * @param {number} days rookie 窗口天数，默认 30
 * @returns [{ name, avatar, score }]
 */
export const aggregateUserHeat = (items = [], mode = "champion", days = 30) => {
  const since =
    mode === "rookie"
      ? Date.now() - days * 24 * 3600 * 1000
      : Number.NEGATIVE_INFINITY;

  const map = new Map(); // nick -> { nick, avatar, score }

  for (const it of items) {
    if (!it?.recommender?.nick) continue;
    const when = new Date(it.createdAt).getTime();
    if (when < since) continue;

    const key = it.recommender.nick;
    const add = heatScore(it);
    if (!map.has(key)) {
      map.set(key, { nick: key, avatar: it.recommender.avatar, score: 0 });
    }
    map.get(key).score += add;
  }

  return Array.from(map.values()).sort((a, b) => b.score - a.score);
};
