// 他人主页：只显示头像+昵称+Ta推荐的书（不可查看Ta收藏/书单）
import React from "react";
import { useParams, useLocation } from "react-router-dom";
import NovelCard from "../components/NovelCard";
import { useAppStore } from "../store/AppStore";

export default function UserProfilePage() {
  const { nick } = useParams();
  const displayNick = decodeURIComponent(nick || "");
  const location = useLocation();
  const { items, setEditingBook } = useAppStore();

  // 从后端列表中过滤出 TA 推荐的书
  const recs = (items || []).filter((i) => {
    const r = i?.recommender;
    const nick = r?.name || r?.nick || r?.nickname;
    return nick === displayNick;
  });

  // 头像：优先用书卡里 recommender.avatar（若能命中），否则占位
  const avatarFromBooks =
    recs.find((i) => i?.recommender?.avatar)?.recommender?.avatar || null;
  const avatarFromNav = location.state?.avatar;
  const user = {
    nick: displayNick,
    avatar:
      avatarFromNav || avatarFromBooks || "https://i.pravatar.cc/80?img=24",
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <img src={user.avatar} className="w-20 h-20 rounded-full" />
        <div className="text-center sm:text-left">
          <div className="text-xl font-semibold">{user.nick}</div>
          <div className="text-gray-500 text-sm">仅展示：头像、昵称、TA推荐的书</div>
        </div>
      </div>

      <div className="mt-6 text-lg font-semibold">TA推荐的书（{recs.length}）</div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recs.map((item) => (
          <NovelCard
            key={item.id}
            item={item}
            saved={false}
            onToggleSave={() => {}}
            onOpenDetail={() => {}}
            onOpenComments={() => {}}
            onOpenUser={() => {}}
            onEdit={() => setEditingBook(item)}
          />
        ))}
        {recs.length === 0 && (
          <div className="text-sm text-gray-500">暂无推荐</div>
        )}
      </div>
    </div>
  );
}
