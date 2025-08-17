// src/lib/mock.js
// mock 数据生成 + 辅助方法
import { CATEGORIES, ORIENTATIONS, TAGS } from "./constants";

const now = new Date();
const hoursAgo = (h) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function makeTitle() {
  const a = ["风起","星河","人间","长夜","云上","折桂","朝露","余烬","故城","北海"];
  const b = ["一梦","如火","旧事","外传","志","秘闻","札记","行记","回廊","问答"];
  return `《${rnd(a)}${rnd(b)}》`;
}

export const BASE_ITEMS = [
  {
    id: "seed-1",
    title: "《星海折叠》",
    author: "乘舟",
    orientation: "BL主受",
    category: "科幻",
    tags: ["科幻", "群像", "慢热"],
    blurb: "宇宙尺度上的温柔与孤独，太空考古+文明接触，设定派最爱，强推！",
    summary:
      "在星际废墟的考古中，主角们意外触发折叠文明的遗迹。文明的回声、记忆的涟漪、人与人之间的救赎与拥抱。",
    createdAt: hoursAgo(1),
    likes: 134,
    bookmarks: 56,
    comments: 3,
    recommender: { nick: "谷雨", avatar: "https://i.pravatar.cc/80?img=32", count: 3 },
  },
  {
    id: "seed-2",
    title: "《时间的形状》",
    author: "阿虚",
    orientation: "言情",
    category: "剧情",
    tags: ["群像", "治愈", "悬疑推理"],
    blurb: "时间裂缝中的群像与相互救赎，设定完整、文笔细腻。",
    summary: "主角在循环里寻找彼此，次要人物弧线饱满。通过碎片叙事揭示真相，情感自然推进。",
    createdAt: hoursAgo(6),
    likes: 92,
    bookmarks: 35,
    comments: 2,
    recommender: { nick: "麦穗", avatar: "https://i.pravatar.cc/80?img=12", count: 4 },
  },
  {
    id: "seed-3",
    title: "《长风几万里》",
    author: "南风知我意",
    orientation: "言情",
    category: "历史",
    tags: ["女强", "悬疑推理", "破镜重圆"],
    blurb: "女主立志做第一捕快，与皇城司大人携手破案，推理稳健，感情线自然。",
    summary: "朝堂风云下的连环奇案，江湖与庙堂并行。人物成长清晰，案件结构巧妙。",
    createdAt: hoursAgo(28),
    likes: 61,
    bookmarks: 40,
    comments: 1,
    recommender: { nick: "小仓鼠", avatar: "https://i.pravatar.cc/80?img=5", count: 1 },
  },
];

export function genMock(n = 18) {
  const items = [];
  for (let i = 0; i < n; i++) {
    const category = rnd(CATEGORIES);
    const orientation = rnd(ORIENTATIONS);
    const likes = rint(0, 180);
    const hours = rint(0, 240);
    const title = makeTitle();
    const tags = Array.from(new Set([rnd(TAGS), rnd(TAGS), rnd(TAGS)])).slice(0, 3);
    items.push({
      id: "g" + i,
      title,
      author: ["江城", "白芷", "舟行", "南山", "阿虚", "十里", "清欢"][rint(0, 6)],
      orientation,
      category,
      tags,
      blurb: `${category}题材 · ${orientation} · ${tags.join(" / ")}，完成度高，口碑稳。`,
      summary: "这是一段关于成长/选择/和解的故事。叙事稳定、人物饱满、节奏张弛有度。",
      createdAt: hoursAgo(hours),
      likes,
      bookmarks: rint(0, 120),
      comments: rint(0, 50),
      recommender: {
        nick: ["谷雨","麦穗","小仓鼠","长夜灯","风栖"][rint(0, 4)],
        avatar: `https://i.pravatar.cc/80?img=${rint(1, 60)}`,
        count: rint(1, 5),
      },
    });
  }
  return items;
}

export const MOCK_ITEMS = [...BASE_ITEMS, ...genMock(18)];

export const MOCK_LEADERS = [
  { nick: "谷雨", score: 981, avatar: "https://i.pravatar.cc/80?img=32" },
  { nick: "麦穗", score: 864, avatar: "https://i.pravatar.cc/80?img=12" },
  { nick: "小仓鼠", score: 733, avatar: "https://i.pravatar.cc/80?img=5" },
  { nick: "长夜灯", score: 512, avatar: "https://i.pravatar.cc/80?img=14" },
  { nick: "风栖", score: 401, avatar: "https://i.pravatar.cc/80?img=23" },
  { nick: "白梅", score: 355, avatar: "https://i.pravatar.cc/80?img=37" },
  { nick: "清岚", score: 322, avatar: "https://i.pravatar.cc/80?img=21" },
  { nick: "拾荒人", score: 305, avatar: "https://i.pravatar.cc/80?img=44" },
  { nick: "芒果冰", score: 292, avatar: "https://i.pravatar.cc/80?img=9" },
  { nick: "溪水", score: 280, avatar: "https://i.pravatar.cc/80?img=28" },
];
