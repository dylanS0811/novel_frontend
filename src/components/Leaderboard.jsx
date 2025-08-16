import React, { useEffect, useMemo, useState } from "react";
import { Crown } from "lucide-react";
import { THEME } from "../lib/theme";
import { aggregateUserHeat } from "../lib/utils";

/**
 * 销冠 / 新秀 排行榜（默认 Top 10）
 * - 销冠：历史累计热度
 * - 新秀：近 30 天热度
 * props:
 *  - items: 全量书目数组（可选，用于回退本地聚合）
 *  - onOpenUser: 点击用户回调
 *  - fetcher?: 可选自定义拉取函数 (type: "champion"|"rookie", limit:number) => Promise<[{name, avatar, score}]>
 */
export default function Leaderboard({ items = [], onOpenUser, fetcher }) {
  const [tab, setTab] = useState("champion"); // champion | rookie

  // 后端数据（优先使用）
  const [remote, setRemote] = useState({ loading: false, data: [], err: null });

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      setRemote((s) => ({ ...s, loading: true, err: null }));
      try {
        let data;
        if (fetcher) {
          data = await fetcher(tab, 10);
        } else {
          // 直接调后端 /api/leaderboard
          const resp = await fetch(`/api/leaderboard?type=${tab}&limit=10`);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const json = await resp.json();
          // 兼容返回结构 {code, data: [{ rank, name, avatar, score }]}
          data = Array.isArray(json?.data) ? json.data : [];
        }
        if (!aborted) setRemote({ loading: false, data, err: null });
      } catch (e) {
        if (!aborted) setRemote({ loading: false, data: [], err: e });
      }
    };
    load();
    return () => {
      aborted = true;
    };
  }, [tab, fetcher]);

  // 回退：本地聚合（与原实现一致）
  const localTop10 = useMemo(
    () => aggregateUserHeat(items, tab).slice(0, 10),
    [items, tab]
  );

  // 实际渲染的数据：优先 remote，其次 local
  const list = (remote.data?.length ? remote.data : localTop10) || [];

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #FFF7FA 100%)",
        borderColor: THEME.border,
        boxShadow: THEME.shadow,
      }}
    >
      {/* 头部 */}
      <div
        className="px-4 py-3 text-white flex items-center gap-2"
        style={{ background: "linear-gradient(135deg,#F59E0B,#FBBF24)" }}
      >
        <Crown className="w-5 h-5" />
        <div className="font-semibold">排行榜</div>

        {/* 分段开关：选中更明显 */}
        <div className="ml-auto">
          <div className="flex items-center rounded-full bg-white/25 p-0.5">
            <button
              onClick={() => setTab("champion")}
              aria-pressed={tab === "champion"}
              className={
                "px-3 py-1.5 rounded-full text-sm transition " +
                (tab === "champion"
                  ? "bg-white text-amber-700 shadow-sm"
                  : "bg-transparent text-white/90 hover:text-white")
              }
              title="历史累计热度"
              type="button"
            >
              销冠
            </button>
            <button
              onClick={() => setTab("rookie")}
              aria-pressed={tab === "rookie"}
              className={
                "px-3 py-1.5 rounded-full text-sm transition " +
                (tab === "rookie"
                  ? "bg白 text-amber-700 shadow-sm"
                  : "bg-transparent text-white/90 hover:text-white")
              }
              title="近30天热度"
              type="button"
            >
              新秀
            </button>
          </div>
        </div>
      </div>

      {/* 列表 */}
      <div className="p-4">
        {remote.loading && (
          <div className="text-sm text-gray-500 px-2 pb-2">加载中…</div>
        )}

        <div className="space-y-3">
          {list.map((u, i) => (
            <button
              key={(u.name || u.nick || "u") + i}
              onClick={() => onOpenUser && onOpenUser({ name: u.name, avatar: u.avatar })}
              className="w-full text-left flex items-center gap-3 rounded-xl px-2 py-2 transition"
              style={{
                background: i < 3 ? "rgba(254,243,199,0.45)" : "#FFFFFF",
                border: `1px solid ${THEME.border}`,
              }}
              type="button"
            >
              {/* 序号徽章：前 3 名更醒目 */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                style={{
                  background:
                    i === 0
                      ? "linear-gradient(135deg, #F59E0B, #FBBF24)"
                      : i === 1
                      ? "linear-gradient(135deg, #9CA3AF, #D1D5DB)"
                      : i === 2
                      ? "linear-gradient(135deg, #B45309, #D97706)"
                      : "#E5E7EB",
                  color: i >= 3 ? "#374151" : "#fff",
                }}
              >
                {i + 1}
              </div>

              <img src={u.avatar} className="w-8 h-8 rounded-full" alt={u.name} />
              <div className="flex-1">{u.name}</div>
              <div className="text-sm text-gray-600">{u.score}</div>
            </button>
          ))}

          {!remote.loading && list.length === 0 && (
            <div className="text-sm text-gray-500 px-2">暂无数据</div>
          )}
        </div>

        <div className="text-[11px] text-gray-400 mt-3 px-2">
          {tab === "champion" ? "历史累计热度" : "近30天热度"} = 点赞×1 + 收藏×2 + 评论×3
        </div>
      </div>
    </div>
  );
}
