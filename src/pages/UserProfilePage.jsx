// 他人主页：只显示头像+昵称+Ta推荐的书（不可查看Ta收藏/书单）
import React from "react";
import { useParams, useLocation } from "react-router-dom";
import NovelCard from "../components/NovelCard";
import Pagination from "../components/Pagination";
import { useAppStore } from "../store/AppStore";
import { useBooks } from "../api/hooks";

export default function UserProfilePage() {
  const { nick } = useParams();
  const displayNick = decodeURIComponent(nick || "");
  const location = useLocation();
  const { setEditingBook } = useAppStore();

  const [page, setPage] = React.useState(1);
  const size = 20;
  const userId = location.state?.userId;
  const query = {
    page,
    size,
    tab: "new",
    ...(userId ? { recommenderId: userId } : { recommender: displayNick }),
  };
  const { data: res, isLoading } = useBooks(query);
  const data = res?.data || res || {};
  const recs = data.list ?? data.items ?? [];
  const total = data.total ?? recs.length ?? 0;

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

      <div className="mt-6 text-lg font-semibold">TA推荐的书（{total}）</div>
      {isLoading ? (
        <div className="mt-3 text-sm text-gray-500">加载中...</div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <Pagination
            page={page}
            size={size}
            total={total}
            onChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </div>
  );
}
